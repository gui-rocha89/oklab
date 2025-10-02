import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, PencilBrush } from 'fabric';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Trash2, Circle, Square, Type, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface VideoOverlayDrawingProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoContainerRef: React.RefObject<HTMLDivElement>;
  onSave: (imageBlob: Blob, comment: string) => void;
  onCancel: () => void;
}

export const VideoOverlayDrawing = ({
  videoRef,
  videoContainerRef,
  onSave,
  onCancel,
}: VideoOverlayDrawingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'pen' | 'circle' | 'rectangle' | 'text'>('pen');
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [comment, setComment] = useState('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate canvas dimensions based on video container
  useEffect(() => {
    const updateDimensions = () => {
      if (videoContainerRef.current) {
        const rect = videoContainerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [videoContainerRef]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: dimensions.width,
      height: dimensions.height,
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

    console.log('✅ Overlay canvas inicializado:', dimensions);

    return () => {
      canvas.dispose();
    };
  }, [dimensions.width, dimensions.height]);

  // Update drawing mode and brush
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'pen';
    
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = 3;
    }
  }, [activeTool, brushColor]);

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
    if (!videoRef.current || !fabricCanvasRef.current) {
      toast.error('Erro ao salvar anotação');
      return;
    }

    if (!comment.trim()) {
      toast.error('Por favor, adicione um comentário');
      return;
    }

    try {
      // Create temporary canvas to combine video frame + drawings
      const tempCanvas = document.createElement('canvas');
      const video = videoRef.current;
      
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Draw video frame
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      // Draw Fabric.js canvas on top
      const fabricCanvas = fabricCanvasRef.current;
      const fabricData = fabricCanvas.toDataURL({
        format: 'png',
        multiplier: tempCanvas.width / fabricCanvas.width!,
      });

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        
        tempCanvas.toBlob((blob) => {
          if (blob) {
            onSave(blob, comment);
          } else {
            toast.error('Erro ao gerar imagem');
          }
        }, 'image/png');
      };
      img.src = fabricData;
    } catch (error) {
      console.error('Erro ao salvar anotação:', error);
      toast.error('Erro ao salvar anotação');
    }
  };

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#000000'];

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
      {/* Canvas Overlay */}
      <div 
        className="relative" 
        style={{ 
          width: dimensions.width, 
          height: dimensions.height,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 cursor-crosshair"
          style={{ zIndex: 100 }}
        />

        {/* Floating Toolbar */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 flex flex-col gap-2 z-[101]">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeTool === 'pen' ? 'default' : 'outline'}
              onClick={() => setActiveTool('pen')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {colors.map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded border-2 border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => setBrushColor(color)}
              />
            ))}
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

        {/* Comment and Action Buttons */}
        <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-[101]">
          <textarea
            className="w-full p-2 border rounded-md bg-background text-foreground resize-none mb-3"
            placeholder="Adicione um comentário sobre esta anotação..."
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
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
    </div>
  );
};
