import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Circle, Path } from 'fabric';
import { Button } from '@/components/ui/button';
import { Pencil, Circle as CircleIcon, Eraser, Undo, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Shape, Pt } from '@/types/review';
import { normalizeShape } from '@/lib/shapeUtils';

interface DrawingCanvasProps {
  videoWidth: number;
  videoHeight: number;
  onComplete: (shapes: Shape[]) => void;
  onCancel: () => void;
  color?: string;
}

export const DrawingCanvas = ({
  videoWidth,
  videoHeight,
  onComplete,
  onCancel,
  color = '#FF3B30'
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [tool, setTool] = useState<'pencil' | 'circle'>('pencil');
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: videoWidth,
      height: videoHeight,
      backgroundColor: 'transparent',
      isDrawingMode: false,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = 3;

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [videoWidth, videoHeight]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = tool === 'pencil';
    
    if (tool === 'pencil') {
      fabricCanvas.freeDrawingBrush.color = color;
      fabricCanvas.freeDrawingBrush.width = 3;
    }

    const handlePathCreated = (e: any) => {
      if (tool !== 'pencil') return;
      
      const path = e.path as Path;
      const pathData = path.path;
      
      const points: Pt[] = [];
      pathData?.forEach((segment: any) => {
        if (segment[0] === 'M' || segment[0] === 'L') {
          points.push({ x: segment[1], y: segment[2] });
        }
      });

      const shape: Shape = {
        id: crypto.randomUUID(),
        type: 'path',
        color: color,
        width: 3,
        points: points
      };

      setShapes(prev => [...prev, shape]);
    };

    if (tool === 'pencil') {
      fabricCanvas.on('path:created', handlePathCreated);
    }

    return () => {
      fabricCanvas.off('path:created', handlePathCreated);
    };
  }, [fabricCanvas, tool, color]);

  const handleCircleTool = () => {
    if (!fabricCanvas || tool !== 'circle') return;

    const circle = new Circle({
      left: videoWidth / 2 - 30,
      top: videoHeight / 2 - 30,
      radius: 30,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 3,
    });

    fabricCanvas.add(circle);

    const shape: Shape = {
      id: crypto.randomUUID(),
      type: 'circle',
      color: color,
      width: 3,
      points: [
        { x: (videoWidth / 2 - 30), y: (videoHeight / 2 - 30) },
        { x: 30, y: 30 } // radius encoded as second point
      ]
    };

    setShapes(prev => [...prev, shape]);
  };

  useEffect(() => {
    if (tool === 'circle') {
      handleCircleTool();
      setTool('pencil'); // Reset to pencil after adding circle
    }
  }, [tool]);

  const handleUndo = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
      setShapes(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    setShapes([]);
  };

  const handleComplete = () => {
    // Normalize shapes before saving
    const normalized = shapes.map(s => normalizeShape(s, videoWidth, videoHeight));
    onComplete(normalized);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="relative">
        <canvas ref={canvasRef} className="border-2 border-primary" />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2 bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <Button
            variant={tool === 'pencil' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setTool('pencil')}
            title="Desenhar à mão livre"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'circle' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setTool('circle')}
            title="Adicionar círculo"
          >
            <CircleIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleUndo}
            disabled={shapes.length === 0}
            title="Desfazer"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={shapes.length === 0}
            title="Limpar tudo"
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleComplete}
            disabled={shapes.length === 0}
          >
            <Check className="w-4 h-4 mr-2" />
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
};
