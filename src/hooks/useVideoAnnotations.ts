import { useState, useCallback, useRef } from 'react';
import { Canvas as FabricCanvas, util } from 'fabric';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizeCanvasData, convertFromReferenceResolution, REFERENCE_WIDTH, REFERENCE_HEIGHT } from '@/lib/annotationUtils';

interface Annotation {
  id: string;
  timestamp_ms: number;
  canvas_data: any;
  comment: string | null;
  created_at: string;
}

export const useVideoAnnotations = (projectId: string | undefined) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<'pen' | 'circle' | 'rectangle' | 'text' | 'select'>('pen');
  const [brushColor, setBrushColor] = useState('#ef4444');
  const [brushWidth, setBrushWidth] = useState(4);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const historyRef = useRef<any[]>([]);
  const historyStepRef = useRef(0);

  const loadAnnotations = useCallback(async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('video_annotations')
        .select('*')
        .eq('project_id', projectId)
        .order('timestamp_ms', { ascending: true });

      if (error) throw error;
      setAnnotations(data || []);
    } catch (error) {
      console.error('Error loading annotations:', error);
      toast.error('Erro ao carregar anotações');
    }
  }, [projectId]);

  const saveAnnotation = useCallback(async (timestampMs: number, comment?: string) => {
    if (!projectId || !fabricCanvasRef.current) {
      console.error('❌ Não é possível salvar: projectId ou canvas não disponível');
      return;
    }

    try {
      const canvas = fabricCanvasRef.current;
      const canvasData = canvas.toJSON();
      
      console.group('💾 SALVANDO ANOTAÇÃO');
      console.log('Project ID:', projectId);
      console.log('Timestamp:', timestampMs, 'ms');
      console.log('Comentário:', comment || '(sem comentário)');
      console.log('Dimensões do canvas:', `${canvas.width}x${canvas.height}`);
      console.log('Objetos no canvas:', canvasData.objects?.length || 0);
      
      if (canvasData.objects && canvasData.objects.length > 0) {
        console.log('Primeiro objeto (antes de normalizar):', JSON.stringify(canvasData.objects[0], null, 2).substring(0, 300));
      }
      
      // Normalizar coordenadas para a resolução de referência (1280x720)
      const normalizedData = normalizeCanvasData(
        canvasData,
        canvas.width || 0,
        canvas.height || 0
      );
      
      console.log('📐 Normalização:', {
        originalDimensions: `${canvas.width}x${canvas.height}`,
        referenceDimensions: `${REFERENCE_WIDTH}x${REFERENCE_HEIGHT}`,
        scaleX: (REFERENCE_WIDTH / (canvas.width || 1)).toFixed(3),
        scaleY: (REFERENCE_HEIGHT / (canvas.height || 1)).toFixed(3),
        objectsNormalized: normalizedData.objects?.length || 0
      });
      
      if (normalizedData.objects && normalizedData.objects.length > 0) {
        console.log('Primeiro objeto (depois de normalizar):', JSON.stringify(normalizedData.objects[0], null, 2).substring(0, 300));
      }
      
      const { data, error } = await supabase
        .from('video_annotations')
        .insert({
          project_id: projectId,
          timestamp_ms: timestampMs,
          canvas_data: normalizedData,
          comment: comment || null,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Anotação salva no banco:', data.id);
      console.groupEnd();

      setAnnotations(prev => [...prev, data].sort((a, b) => a.timestamp_ms - b.timestamp_ms));
      toast.success('Anotação salva com sucesso!');
      
      return data;
    } catch (error) {
      console.error('❌ ERRO ao salvar anotação:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
      console.groupEnd();
      toast.error('Erro ao salvar anotação');
    }
  }, [projectId]);

  const loadAnnotationToCanvas = useCallback(async (annotation: Annotation) => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      canvas.clear();
      
      const currentWidth = canvas.width || REFERENCE_WIDTH;
      const currentHeight = canvas.height || REFERENCE_HEIGHT;
      
      console.log('🎨 Carregando anotação no canvas:', {
        annotationId: annotation.id,
        currentDimensions: `${currentWidth}x${currentHeight}`,
        referenceDimensions: `${REFERENCE_WIDTH}x${REFERENCE_HEIGHT}`,
        scaleX: (currentWidth / REFERENCE_WIDTH).toFixed(3),
        scaleY: (currentHeight / REFERENCE_HEIGHT).toFixed(3)
      });
      
      if (annotation.canvas_data?.objects && annotation.canvas_data.objects.length > 0) {
        const convertedObjects = convertFromReferenceResolution(
          annotation.canvas_data.objects,
          currentWidth,
          currentHeight
        );
        
        const objects = await util.enlivenObjects(convertedObjects);
        
        objects.forEach((obj: any) => {
          if (obj) {
            obj.set({
              selectable: false,
              evented: false,
            });
            obj.setCoords();
            canvas.add(obj);
          }
        });
        
        console.log(`✅ ${objects.length} objetos adicionados ao canvas`);
      }
      
      canvas.renderAll();
    } catch (error) {
      console.error('Error loading annotation to canvas:', error);
    }
  }, []);

  const deleteAnnotation = useCallback(async (annotationId: string) => {
    try {
      const { error } = await supabase
        .from('video_annotations')
        .delete()
        .eq('id', annotationId);

      if (error) throw error;

      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      toast.success('Anotação excluída');
    } catch (error) {
      console.error('Error deleting annotation:', error);
      toast.error('Erro ao excluir anotação');
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.renderAll();
  }, []);

  const undo = useCallback(() => {
    if (!fabricCanvasRef.current || historyStepRef.current === 0) return;
    
    historyStepRef.current -= 1;
    const canvas = fabricCanvasRef.current;
    canvas.clear();
    
    if (historyStepRef.current > 0) {
      canvas.loadFromJSON(historyRef.current[historyStepRef.current - 1]);
    }
    canvas.renderAll();
  }, []);

  const redo = useCallback(() => {
    if (!fabricCanvasRef.current || historyStepRef.current >= historyRef.current.length) return;
    
    historyStepRef.current += 1;
    const canvas = fabricCanvasRef.current;
    canvas.loadFromJSON(historyRef.current[historyStepRef.current - 1]);
    canvas.renderAll();
  }, []);

  const saveHistory = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const json = fabricCanvasRef.current.toJSON();
    historyRef.current = historyRef.current.slice(0, historyStepRef.current);
    historyRef.current.push(json);
    historyStepRef.current += 1;
  }, []);

  const setCanvas = useCallback((canvas: FabricCanvas) => {
    fabricCanvasRef.current = canvas;
    
    canvas.on('object:added', saveHistory);
    canvas.on('object:modified', saveHistory);
    canvas.on('object:removed', saveHistory);
  }, [saveHistory]);

  return {
    annotations,
    currentTool,
    setCurrentTool,
    brushColor,
    setBrushColor,
    brushWidth,
    setBrushWidth,
    isDrawingMode,
    setIsDrawingMode,
    loadAnnotations,
    saveAnnotation,
    loadAnnotationToCanvas,
    deleteAnnotation,
    clearCanvas,
    undo,
    redo,
    setCanvas,
    canUndo: historyStepRef.current > 0,
    canRedo: historyStepRef.current < historyRef.current.length,
  };
};
