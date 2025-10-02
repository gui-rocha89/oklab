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
}

export const SimpleAnnotationCreator = ({
  videoElement,
  timestampMs,
  onSave,
  onCancel
}: SimpleAnnotationCreatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [comment, setComment] = useState('');
  const [currentTool, setCurrentTool] = useState<'pen' | 'circle' | 'rectangle' | 'text'>('pen');
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  useEffect(() => {
    if (!canvasRef.current || !videoElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size to video dimensions
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Draw current video frame
    ctx.drawImage(videoElement, 0, 0);
    
    // Set this as background for the annotation canvas
    const bgImage = canvas.toDataURL();
    
    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 450,
      backgroundColor: '#000'
    });

    // Set background image using Fabric.js v6 API
    (async () => {
      const { FabricImage } = await import('fabric');
      const img = await FabricImage.fromURL(bgImage);
      img.scaleToWidth(800);
      img.scaleToHeight(450);
      fabricCanvas.backgroundImage = img;
      fabricCanvas.renderAll();
    })();

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
  }, []);

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
    <div className="fixed inset-0 bg-background/95 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Create Annotation</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Annotation
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-black rounded-lg overflow-hidden shadow-lg">
            <canvas ref={canvasRef} />
          </div>
          
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
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
            
            <div className="w-px bg-border mx-2" />
            
            {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#FFFFFF'].map(color => (
              <button
                key={color}
                className="w-8 h-8 rounded border-2 transition-transform hover:scale-110"
                style={{ 
                  backgroundColor: color,
                  borderColor: brushColor === color ? '#000' : '#666'
                }}
                onClick={() => setBrushColor(color)}
              />
            ))}
            
            <div className="w-px bg-border mx-2" />
            
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

        <div className="w-full md:w-80 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Comment (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment about this annotation..."
              rows={6}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Draw on the video frame to highlight areas.</p>
            <p className="mt-2">Use the tools above to add annotations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
