import { Pen, Circle, Square, Type, MousePointer, Undo, Redo, Trash2, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface DrawingToolbarProps {
  currentTool: 'pen' | 'circle' | 'rectangle' | 'text' | 'select';
  onToolChange: (tool: 'pen' | 'circle' | 'rectangle' | 'text' | 'select') => void;
  brushColor: string;
  onColorChange: (color: string) => void;
  brushWidth: number;
  onBrushWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ffffff', // white
  '#000000', // black
];

const BRUSH_SIZES = [2, 4, 6, 8, 12];

export const DrawingToolbar = ({
  currentTool,
  onToolChange,
  brushColor,
  onColorChange,
  brushWidth,
  onBrushWidthChange,
  onUndo,
  onRedo,
  onClear,
  onSave,
  canUndo,
  canRedo,
}: DrawingToolbarProps) => {
  return (
    <div className="bg-background/98 backdrop-blur-sm border border-border/50 rounded-md p-1 shadow-md">
      <div className="flex items-center gap-1 flex-wrap">
        {/* Tools */}
        <div className="flex gap-0.5">
          <Button
            variant={currentTool === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('select')}
            className="h-7 w-7 p-0"
            title="Selecionar"
          >
            <MousePointer className="w-3 h-3" />
          </Button>
          <Button
            variant={currentTool === 'pen' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('pen')}
            className="h-7 w-7 p-0"
            title="Caneta"
          >
            <Pen className="w-3 h-3" />
          </Button>
          <Button
            variant={currentTool === 'circle' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('circle')}
            className="h-7 w-7 p-0"
            title="Círculo"
          >
            <Circle className="w-3 h-3" />
          </Button>
          <Button
            variant={currentTool === 'rectangle' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('rectangle')}
            className="h-7 w-7 p-0"
            title="Retângulo"
          >
            <Square className="w-3 h-3" />
          </Button>
          <Button
            variant={currentTool === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('text')}
            className="h-7 w-7 p-0"
            title="Texto"
          >
            <Type className="w-3 h-3" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Colors */}
        <div className="flex gap-0.5">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-5 h-5 rounded-full border transition-all ${
                brushColor === color ? 'border-primary ring-1 ring-primary/30 scale-105' : 'border-border/50'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Cor ${color}`}
              title={`Cor ${color}`}
            />
          ))}
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Brush Width */}
        <div className="flex gap-0.5">
          {BRUSH_SIZES.map((size) => (
            <Button
              key={size}
              variant={brushWidth === size ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onBrushWidthChange(size)}
              className="h-7 w-7 p-0"
              title={`Espessura ${size}px`}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: Math.min(size, 10), height: Math.min(size, 10) }}
              />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Actions */}
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-7 w-7 p-0"
            title="Desfazer"
          >
            <Undo className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-7 w-7 p-0"
            title="Refazer"
          >
            <Redo className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            title="Limpar tudo"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            className="h-7 px-2 ml-0.5"
          >
            <Save className="w-3 h-3 mr-1" />
            <span className="text-xs">Salvar</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
