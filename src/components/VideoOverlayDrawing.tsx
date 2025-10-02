import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, PencilBrush } from 'fabric';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Trash2, Pencil, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VideoOverlayDrawingProps {
  frameUrl: string;
  containerWidth: number;
  containerHeight: number;
  onSave: (imageBlob: Blob, comment: string) => void;
  onCancel: () => void;
}

export const VideoOverlayDrawing = ({
  frameUrl,
  containerWidth,
  containerHeight,
  onSave,
  onCancel,
}: VideoOverlayDrawingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'pen'>('pen');
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [comment, setComment] = useState('');

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || containerWidth === 0 || containerHeight === 0) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerWidth,
      height: containerHeight,
      backgroundColor: 'transparent',
    });

    const brush = new PencilBrush(canvas);
    brush.color = brushColor;
    brush.width = 3;
    canvas.freeDrawingBrush = brush;
    canvas.isDrawingMode = true;

    fabricCanvasRef.current = canvas;

    const initialState = JSON.stringify(canvas.toJSON());
    setHistory([initialState]);
    setHistoryStep(0);

    console.log('✅ Canvas de desenho inicializado:', { containerWidth, containerHeight });

    return () => {
      canvas.dispose();
    };
  }, [containerWidth, containerHeight]);

  // Update brush color
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = true;
    
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = 3;
    }
  }, [brushColor]);

  // Track canvas changes for undo/redo
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleObjectAdded = () => {
      const currentState = JSON.stringify(canvas.toJSON());
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(currentState);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    };

    canvas.on('object:added', handleObjectAdded);
    return () => {
      canvas.off('object:added', handleObjectAdded);
    };
  }, [history, historyStep]);

  const handleUndo = () => {
    if (historyStep > 0) {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const previousStep = historyStep - 1;
      const previousState = history[previousStep];
      canvas.loadFromJSON(previousState, () => {
        canvas.renderAll();
        setHistoryStep(previousStep);
      });
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const nextStep = historyStep + 1;
      const nextState = history[nextStep];
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setHistoryStep(nextStep);
      });
    }
  };

  const handleClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = 'transparent';
    canvas.renderAll();

    const clearedState = JSON.stringify(canvas.toJSON());
    setHistory([...history, clearedState]);
    setHistoryStep(history.length);
  };

  const handleSave = async () => {
    if (!imgRef.current || !fabricCanvasRef.current) {
      toast.error('Erro ao salvar anotação');
      return;
    }

    if (!comment.trim()) {
      toast.error('Por favor, adicione um comentário');
      return;
    }

    try {
      // Create temporary canvas to combine frame + drawings
      const tempCanvas = document.createElement('canvas');
      const img = imgRef.current;
      
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Draw captured frame
      ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

      // Draw Fabric.js canvas on top
      const fabricCanvas = fabricCanvasRef.current;
      const fabricData = fabricCanvas.toDataURL({
        format: 'png',
        multiplier: tempCanvas.width / fabricCanvas.width!,
      });

      const fabricImg = new Image();
      fabricImg.onload = () => {
        ctx.drawImage(fabricImg, 0, 0, tempCanvas.width, tempCanvas.height);
        
        tempCanvas.toBlob((blob) => {
          if (blob) {
            console.log('✅ Anotação combinada gerada:', blob.size, 'bytes');
            onSave(blob, comment);
          } else {
            toast.error('Erro ao gerar imagem');
          }
        }, 'image/webp', 0.95);
      };
      fabricImg.src = fabricData;
    } catch (error) {
      console.error('Erro ao salvar anotação:', error);
      toast.error('Erro ao salvar anotação');
    }
  };

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#000000'];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 gap-3">
      {/* Toolbar ACIMA */}
      <div className="w-full max-w-5xl bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Ferramenta:</span>
          <Button
            size="sm"
            variant="default"
            disabled
          >
            <Pencil className="h-4 w-4 mr-1" />
            Desenhar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Cor:</span>
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                className="w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: color,
                  borderColor: brushColor === color ? 'hsl(var(--primary))' : 'transparent'
                }}
                onClick={() => setBrushColor(color)}
                aria-label={`Cor ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={handleUndo} disabled={historyStep <= 0}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleRedo} disabled={historyStep >= history.length - 1}>
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Frame + Canvas */}
      <div 
        className="relative bg-black rounded-lg overflow-hidden shadow-2xl" 
        style={{ 
          width: containerWidth, 
          height: containerHeight,
          maxWidth: '100%',
          maxHeight: '60vh'
        }}
      >
        <img 
          ref={imgRef}
          src={frameUrl} 
          alt="Frame capturado" 
          className="w-full h-full object-contain"
        />
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 cursor-crosshair"
        />
      </div>

      {/* Painel de comentário ABAIXO */}
      <div className="w-full max-w-5xl bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4">
        <textarea
          className="w-full p-3 border rounded-md bg-background text-foreground resize-none mb-3"
          placeholder="Adicione um comentário sobre esta anotação..."
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Salvar Anotação
          </Button>
        </div>
      </div>
    </div>
  );
};