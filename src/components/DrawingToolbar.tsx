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
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-1.5 shadow-lg">
      <div className="flex items-center gap-1.5">
        {/* Tools */}
        <div className="flex gap-0.5">
          <Button
            variant={currentTool === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('select')}
            className="h-8 w-8 p-0"
          >
            <MousePointer className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={currentTool === 'pen' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('pen')}
            className="h-8 w-8 p-0"
          >
            <Pen className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={currentTool === 'circle' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('circle')}
            className="h-8 w-8 p-0"
          >
            <Circle className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={currentTool === 'rectangle' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('rectangle')}
            className="h-8 w-8 p-0"
          >
            <Square className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={currentTool === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('text')}
            className="h-8 w-8 p-0"
          >
            <Type className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Colors */}
        <div className="flex gap-0.5">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                brushColor === color ? 'border-primary scale-110' : 'border-border'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select ${color} color`}
            />
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Brush Width */}
        <div className="flex gap-0.5">
          {BRUSH_SIZES.map((size) => (
            <Button
              key={size}
              variant={brushWidth === size ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onBrushWidthChange(size)}
              className="h-8 w-8 p-0"
            >
              <div
                className="rounded-full bg-current"
                style={{ width: size, height: size }}
              />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Actions */}
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-8 w-8 p-0"
          >
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-8 w-8 p-0"
          >
            <Redo className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            className="h-8 px-3"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};
