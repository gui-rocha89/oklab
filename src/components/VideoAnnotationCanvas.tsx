import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, Textbox } from 'fabric';

interface VideoAnnotationCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isDrawingMode: boolean;
  currentTool: 'pen' | 'circle' | 'rectangle' | 'text' | 'select';
  brushColor: string;
  brushWidth: number;
  onCanvasReady?: (canvas: FabricCanvas) => void;
}

export const VideoAnnotationCanvas = ({
  videoRef,
  isDrawingMode,
  currentTool,
  brushColor,
  brushWidth,
  onCanvasReady
}: VideoAnnotationCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const updateDimensions = () => {
      const parentElement = canvasRef.current?.parentElement;
      if (!parentElement) return;
      
      // Get dimensions from the parent container (the overlay div)
      const rect = parentElement.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    };

    // Initial update with a slight delay to ensure parent is rendered
    setTimeout(updateDimensions, 50);
    
    // Update on resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: 'transparent',
      isDrawingMode: false,
    });

    const brush = new PencilBrush(canvas);
    brush.color = brushColor;
    brush.width = brushWidth;
    canvas.freeDrawingBrush = brush;

    fabricCanvasRef.current = canvas;
    onCanvasReady?.(canvas);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [dimensions, onCanvasReady]);

  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.isDrawingMode = isDrawingMode && currentTool === 'pen';

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }
  }, [isDrawingMode, currentTool, brushColor, brushWidth]);

  useEffect(() => {
    if (!fabricCanvasRef.current || !isDrawingMode) return;

    const canvas = fabricCanvasRef.current;

    const handleCanvasClick = (e: any) => {
      if (currentTool === 'select' || currentTool === 'pen') return;

      const pointer = canvas.getPointer(e.e);
      let shape;

      switch (currentTool) {
        case 'circle':
          shape = new Circle({
            left: pointer.x - 25,
            top: pointer.y - 25,
            radius: 25,
            fill: 'transparent',
            stroke: brushColor,
            strokeWidth: brushWidth,
          });
          break;
        case 'rectangle':
          shape = new Rect({
            left: pointer.x - 50,
            top: pointer.y - 25,
            width: 100,
            height: 50,
            fill: 'transparent',
            stroke: brushColor,
            strokeWidth: brushWidth,
          });
          break;
        case 'text':
          shape = new Textbox('Texto', {
            left: pointer.x,
            top: pointer.y,
            fill: brushColor,
            fontSize: 20,
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

    canvas.on('mouse:down', handleCanvasClick);

    return () => {
      canvas.off('mouse:down', handleCanvasClick);
    };
  }, [currentTool, brushColor, brushWidth, isDrawingMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{ 
        pointerEvents: isDrawingMode ? 'auto' : 'none',
        touchAction: isDrawingMode ? 'none' : 'auto',
        cursor: isDrawingMode ? 'crosshair' : 'default',
        zIndex: isDrawingMode ? 100 : 5
      }}
    />
  );
};
