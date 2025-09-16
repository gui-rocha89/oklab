import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Crop, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedFile: File) => void;
}

export function ImageCropModal({ isOpen, onClose, imageFile, onCropComplete }: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const drawImageOnCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurar transformações
    ctx.save();
    
    // Mover para o centro do canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX + imagePosition.x, centerY + imagePosition.y);
    
    // Aplicar rotação
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Aplicar zoom
    ctx.scale(zoom, zoom);
    
    // Desenhar imagem centralizada
    const drawWidth = Math.min(canvas.width, canvas.height) * 0.8;
    const drawHeight = (image.height / image.width) * drawWidth;
    
    ctx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    
    ctx.restore();

    // Desenhar área de crop (círculo)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 90, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Desenhar overlay escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Recortar área circular
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 90, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }, [zoom, rotation, imageLoaded, imagePosition]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setImagePosition(prev => ({
      x: prev.x + deltaX * 0.5,
      y: prev.y + deltaY * 0.5
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Definir tamanho do canvas final (quadrado de 300x300)
    canvas.width = 300;
    canvas.height = 300;

    // Desenhar apenas a parte cortada
    ctx.save();
    
    // Criar máscara circular
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, 2 * Math.PI);
    ctx.clip();
    
    // Aplicar transformações da imagem
    ctx.translate(150 + imagePosition.x, 150 + imagePosition.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    
    // Desenhar imagem
    const image = imageRef.current;
    const size = Math.min(300, 300) * 0.8;
    const drawHeight = (image.height / image.width) * size;
    
    ctx.drawImage(
      image,
      -size / 2,
      -drawHeight / 2,
      size,
      drawHeight
    );
    
    ctx.restore();

    // Converter canvas para blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        onCropComplete(file);
      }
    }, 'image/jpeg', 0.8);
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  };

  // Redesenhar quando houver mudanças
  useEffect(() => {
    if (imageLoaded) {
      drawImageOnCanvas();
    }
  }, [drawImageOnCanvas, imageLoaded]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Ajustar Foto de Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {imageFile && (
            <>
              <div className="relative flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={280}
                  className="border rounded-lg cursor-move bg-gray-50"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                <img
                  ref={imageRef}
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="hidden"
                  onLoad={handleImageLoad}
                />
              </div>

              <div className="space-y-3 text-sm">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <ZoomIn className="h-4 w-4" />
                    Zoom: {zoom.toFixed(1)}x
                  </Label>
                  <Slider
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <RotateCcw className="h-4 w-4" />
                    Rotação: {rotation}°
                  </Label>
                  <Slider
                    value={[rotation]}
                    onValueChange={(value) => setRotation(value[0])}
                    min={-180}
                    max={180}
                    step={15}
                    className="w-full"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={resetTransform}
                  size="sm"
                  className="w-full"
                >
                  Resetar Ajustes
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCrop} className="bg-primary">
            Aplicar Corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}