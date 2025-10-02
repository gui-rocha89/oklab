import { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, Textbox } from 'fabric';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Pencil, Circle as CircleIcon, Square, Type, Undo, Redo, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleAnnotationCreatorProps {
  capturedFrameUrl: string;
  timestampMs: number;
  videoAspectRatio: number;
  onSave: (comment: string, imageBlob: Blob) => void;
  onCancel: () => void;
}

export const SimpleAnnotationCreator: React.FC<SimpleAnnotationCreatorProps> = ({
  capturedFrameUrl,
  timestampMs,
  videoAspectRatio,
  onSave,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [comment, setComment] = useState('');
  const [activeTool, setActiveTool] = useState<'pen' | 'circle' | 'rectangle' | 'text'>('pen');
  const [brushColor, setBrushColor] = useState('#ef4444');
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(450);

  useEffect(() => {
    const calculatedWidth = Math.min(window.innerWidth - 64, 1200);
    const calculatedHeight = calculatedWidth / videoAspectRatio;
    setCanvasWidth(calculatedWidth);
    setCanvasHeight(calculatedHeight);
  }, [videoAspectRatio]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 'transparent',
    });

    const brush = new PencilBrush(canvas);
    brush.color = brushColor;
    brush.width = 3;
    canvas.freeDrawingBrush = brush;
    canvas.isDrawingMode = activeTool === 'pen';

    fabricCanvasRef.current = canvas;

    // Save initial state
    const initialState = JSON.stringify(canvas.toJSON());
    setHistory([initialState]);
    setHistoryStep(0);

    // Track object additions for history
    canvas.on('object:added', () => {
      const json = JSON.stringify(canvas.toJSON());
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(json);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    });

    return () => {
      canvas.dispose();
    };
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.isDrawingMode = activeTool === 'pen';

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
    }
  }, [activeTool, brushColor]);

  const undo = () => {
    if (historyStep > 0 && fabricCanvasRef.current) {
      const prevStep = historyStep - 1;
      fabricCanvasRef.current.loadFromJSON(history[prevStep], () => {
        fabricCanvasRef.current?.renderAll();
      });
      setHistoryStep(prevStep);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1 && fabricCanvasRef.current) {
      const nextStep = historyStep + 1;
      fabricCanvasRef.current.loadFromJSON(history[nextStep], () => {
        fabricCanvasRef.current?.renderAll();
      });
      setHistoryStep(nextStep);
    }
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(json);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const addShape = (pointer: { x: number; y: number }) => {
    if (!fabricCanvasRef.current) return;

    let shape;
    const canvas = fabricCanvasRef.current;

    switch (activeTool) {
      case 'circle':
        shape = new Circle({
          left: pointer.x - 30,
          top: pointer.y - 30,
          radius: 30,
          fill: 'transparent',
          stroke: brushColor,
          strokeWidth: 3,
        });
        break;
      case 'rectangle':
        shape = new Rect({
          left: pointer.x - 50,
          top: pointer.y - 30,
          width: 100,
          height: 60,
          fill: 'transparent',
          stroke: brushColor,
          strokeWidth: 3,
        });
        break;
      case 'text':
        shape = new Textbox('Texto', {
          left: pointer.x,
          top: pointer.y,
          fill: brushColor,
          fontSize: 24,
          fontFamily: 'Arial',
        });
        break;
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  };

  useEffect(() => {
    if (!fabricCanvasRef.current || activeTool === 'pen') return;

    const canvas = fabricCanvasRef.current;
    const handleClick = (e: any) => {
      const pointer = canvas.getPointer(e.e);
      addShape(pointer);
    };

    canvas.on('mouse:down', handleClick);
    return () => {
      canvas.off('mouse:down', handleClick);
    };
  }, [activeTool, brushColor]);

  const handleSave = async () => {
    if (!fabricCanvasRef.current) {
      toast.error("Canvas não está pronto");
      return;
    }

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = capturedFrameUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toast.error("Erro ao criar contexto do canvas");
        return;
      }

      ctx.drawImage(img, 0, 0);

      const fabricCanvas = fabricCanvasRef.current;
      const scaleX = canvas.width / fabricCanvas.getWidth();
      const scaleY = canvas.height / fabricCanvas.getHeight();

      const objects = fabricCanvas.getObjects();
      for (const obj of objects) {
        ctx.save();
        ctx.scale(scaleX, scaleY);
        obj.render(ctx);
        ctx.restore();
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onSave(comment, blob);
          } else {
            toast.error("Erro ao gerar imagem");
          }
        },
        "image/webp",
        0.9
      );
    } catch (error) {
      console.error("Erro ao salvar anotação:", error);
      toast.error("Erro ao salvar anotação");
    }
  };

  return (
    <div className="w-full border border-border bg-background rounded-lg overflow-hidden shadow-lg">
      {/* Toolbar */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={activeTool === "pen" ? "default" : "outline"}
            onClick={() => setActiveTool("pen")}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "circle" ? "default" : "outline"}
            onClick={() => setActiveTool("circle")}
          >
            <CircleIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "rectangle" ? "default" : "outline"}
            onClick={() => setActiveTool("rectangle")}
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "text" ? "default" : "outline"}
            onClick={() => setActiveTool("text")}
          >
            <Type className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-8 mx-2" />

          {["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#ffffff"].map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                brushColor === color ? "border-primary scale-110" : "border-border"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setBrushColor(color)}
            />
          ))}

          <Separator orientation="vertical" className="h-8 mx-2" />

          <Button size="sm" variant="outline" onClick={undo} disabled={historyStep <= 0}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={redo}
            disabled={historyStep >= history.length - 1}
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={clearCanvas}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Area with Captured Frame */}
      <div className="flex items-center justify-center p-4 bg-muted/10">
        <div className="relative mx-auto" style={{ width: canvasWidth, height: canvasHeight }}>
          <img
            src={capturedFrameUrl}
            alt="Frame capturado"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      {/* Comment and Actions */}
      <div className="p-4 border-t border-border bg-muted/30 space-y-3">
        <Textarea
          placeholder="Adicione um comentário sobre esta anotação..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="resize-none"
          rows={2}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Anotação
          </Button>
        </div>
      </div>
    </div>
  );
};
