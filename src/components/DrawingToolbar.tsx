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
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tools */}
        <div className="flex gap-1">
          <Button
            variant={currentTool === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('select')}
            className="touch-manipulation min-h-[44px]"
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          <Button
            variant={currentTool === 'pen' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('pen')}
            className="touch-manipulation min-h-[44px]"
          >
            <Pen className="w-4 h-4" />
          </Button>
          <Button
            variant={currentTool === 'circle' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('circle')}
            className="touch-manipulation min-h-[44px]"
          >
            <Circle className="w-4 h-4" />
          </Button>
          <Button
            variant={currentTool === 'rectangle' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('rectangle')}
            className="touch-manipulation min-h-[44px]"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant={currentTool === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('text')}
            className="touch-manipulation min-h-[44px]"
          >
            <Type className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Colors */}
        <div className="flex gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all touch-manipulation ${
                brushColor === color ? 'border-primary scale-110' : 'border-border'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select ${color} color`}
            />
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Brush Width */}
        <div className="flex gap-1">
          {BRUSH_SIZES.map((size) => (
            <Button
              key={size}
              variant={brushWidth === size ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onBrushWidthChange(size)}
              className="touch-manipulation min-h-[44px] min-w-[44px]"
            >
              <div
                className="rounded-full bg-current"
                style={{ width: size, height: size }}
              />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Actions */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="touch-manipulation min-h-[44px]"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="touch-manipulation min-h-[44px]"
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="touch-manipulation min-h-[44px] text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            className="touch-manipulation min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};
