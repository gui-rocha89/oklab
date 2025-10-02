import { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, Textbox } from 'fabric';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Pencil, Circle as CircleIcon, Square, Type, Eraser, Undo, Redo } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleAnnotationCreatorProps {
  videoElement: HTMLVideoElement;
  timestampMs: number;
  onSave: (comment: string, imageBlob: Blob) => void;
  onCancel: () => void;
  videoContainerRef: React.RefObject<HTMLDivElement>;
}

export const SimpleAnnotationCreator = ({
  videoElement,
  timestampMs,
  onSave,
  onCancel,
  videoContainerRef
}: SimpleAnnotationCreatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [comment, setComment] = useState('');
  const [currentTool, setCurrentTool] = useState<'pen' | 'circle' | 'rectangle' | 'text'>('pen');
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // Get video container dimensions and position canvas overlay
  useEffect(() => {
    if (!videoContainerRef.current || !videoElement) return;

    const updateCanvasSize = () => {
      const container = videoContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      setCanvasDimensions({
        width: rect.width,
        height: rect.height
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [videoContainerRef, videoElement]);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || !videoElement || canvasDimensions.width === 0) return;
    
    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      backgroundColor: 'transparent'
    });

    const brush = new PencilBrush(fabricCanvas);
    brush.color = brushColor;
    brush.width = 3;
    fabricCanvas.freeDrawingBrush = brush;
    fabricCanvas.isDrawingMode = currentTool === 'pen';

    fabricCanvasRef.current = fabricCanvas;

    // Save initial state
    saveHistory();

    return () => {
      fabricCanvas.dispose();
    };
  }, [canvasDimensions]);

  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    canvas.isDrawingMode = currentTool === 'pen';
    
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
    }
  }, [currentTool, brushColor]);

  const saveHistory = () => {
    if (!fabricCanvasRef.current) return;
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(json);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

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

  const addShape = (pointer: { x: number; y: number }) => {
    if (!fabricCanvasRef.current) return;
    
    let shape;
    const canvas = fabricCanvasRef.current;

    switch (currentTool) {
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
        shape = new Textbox('Text', {
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
      saveHistory();
    }
  };

  useEffect(() => {
    if (!fabricCanvasRef.current || currentTool === 'pen') return;

    const canvas = fabricCanvasRef.current;
    const handleClick = (e: any) => {
      const pointer = canvas.getPointer(e.e);
      addShape(pointer);
    };

    canvas.on('mouse:down', handleClick);
    return () => {
      canvas.off('mouse:down', handleClick);
    };
  }, [currentTool, brushColor]);

  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const handleObjectAdded = () => saveHistory();

    canvas.on('object:added', handleObjectAdded);
    return () => {
      canvas.off('object:added', handleObjectAdded);
    };
  }, [history, historyStep]);

  const handleSave = async () => {
    if (!fabricCanvasRef.current || !videoElement) return;

    try {
      // Create final canvas with video frame + annotations
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = videoElement.videoWidth;
      finalCanvas.height = videoElement.videoHeight;
      
      const ctx = finalCanvas.getContext('2d')!;
      
      // Draw video frame
      ctx.drawImage(videoElement, 0, 0);
      
      // Draw annotations on top (scale from display size to video size)
      const fabricCanvas = fabricCanvasRef.current;
      const scaleX = videoElement.videoWidth / fabricCanvas.getWidth();
      const scaleY = videoElement.videoHeight / fabricCanvas.getHeight();
      
      fabricCanvas.getObjects().forEach(obj => {
        ctx.save();
        ctx.scale(scaleX, scaleY);
        obj.render(ctx);
        ctx.restore();
      });
      
      // Convert to blob
      finalCanvas.toBlob((blob) => {
        if (blob) {
          onSave(comment, blob);
        } else {
          toast.error('Failed to create annotation image');
        }
      }, 'image/webp', 0.9);
    } catch (error) {
      console.error('Error saving annotation:', error);
      toast.error('Failed to save annotation');
    }
  };

  return (
    <>
      {/* Transparent canvas overlay directly over the video */}
      <div 
        className="absolute inset-0 z-40"
        style={{ 
          pointerEvents: 'auto',
          cursor: 'crosshair'
        }}
      >
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>

      {/* Floating toolbar at the top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Button
            variant={currentTool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('pen')}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={currentTool === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('circle')}
          >
            <CircleIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={currentTool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('rectangle')}
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant={currentTool === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('text')}
          >
            <Type className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#FFFFFF'].map(color => (
            <button
              key={color}
              className="w-7 h-7 rounded border-2 transition-transform hover:scale-110"
              style={{ 
                backgroundColor: color,
                borderColor: brushColor === color ? '#000' : '#666'
              }}
              onClick={() => setBrushColor(color)}
            />
          ))}
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyStep <= 0}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyStep >= history.length - 1}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Floating comment and actions panel at the bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 w-[90%] max-w-md">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Comentário (opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adicione um comentário sobre esta anotação..."
              rows={3}
              className="resize-none"
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Salvar Anotação
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
