import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Annotation {
  id: string;
  project_id: string;
  timestamp_ms: number;
  timecode: string;
  image_url: string;
  comment?: string;
  created_at: string;
}

export const useVideoAnnotations = (projectId: string | undefined) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatTimecode = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const loadAnnotations = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('video_annotations')
        .select('*')
        .eq('project_id', projectId)
        .order('timestamp_ms', { ascending: true });

      if (error) throw error;

      setAnnotations(data || []);
    } catch (error) {
      console.error('Error loading annotations:', error);
      toast.error('Failed to load annotations');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnnotation = async (
    timestampMs: number,
    imageBlob: Blob,
    comment?: string
  ): Promise<void> => {
    if (!projectId) {
      toast.error('No project ID provided');
      return;
    }

    try {
      console.log('🎨 Iniciando upload da anotação...');
      console.log('📊 Tamanho do blob:', imageBlob.size, 'bytes');
      console.log('📊 Tipo do blob:', imageBlob.type);
      
      // Upload image to Supabase Storage
      const fileName = `${projectId}/${Date.now()}.webp`;
      console.log('📁 Nome do arquivo:', fileName);
      
      const { error: uploadError } = await supabase.storage
        .from('video-annotations')
        .upload(`${fileName}`, imageBlob, {
          contentType: 'image/webp',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }
      
      console.log('✅ Upload concluído!');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('video-annotations')
        .getPublicUrl(`${fileName}`);
      
      console.log('🔗 URL pública:', publicUrl);

      // Save annotation to database
      const { error: dbError } = await supabase
        .from('video_annotations')
        .insert({
          project_id: projectId,
          timestamp_ms: timestampMs,
          timecode: formatTimecode(timestampMs),
          image_url: publicUrl,
          comment: comment || null
        });

      if (dbError) {
        console.error('❌ Erro ao salvar no banco:', dbError);
        throw dbError;
      }
      
      console.log('✅ Anotação salva no banco!');
      toast.success('Annotation saved successfully');
      await loadAnnotations();
    } catch (error) {
      console.error('❌ Error saving annotation:', error);
      toast.error('Failed to save annotation');
      throw error;
    }
  };

  const deleteAnnotation = async (annotationId: string): Promise<void> => {
    try {
      // Get annotation to find image URL
      const annotation = annotations.find(a => a.id === annotationId);
      
      if (annotation?.image_url) {
        // Extract file path from URL
        const urlParts = annotation.image_url.split('/');
        const fileName = urlParts.slice(-2).join('/'); // e.g., "projectId/timestamp.webp"
        
        // Delete from storage
        await supabase.storage
          .from('video-annotations')
          .remove([`${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('video_annotations')
        .delete()
        .eq('id', annotationId);

      if (error) throw error;

      toast.success('Annotation deleted');
      await loadAnnotations();
    } catch (error) {
      console.error('Error deleting annotation:', error);
      toast.error('Failed to delete annotation');
    }
  };

  useEffect(() => {
    loadAnnotations();
  }, [projectId]);

  return {
    annotations,
    isLoading,
    saveAnnotation,
    deleteAnnotation,
    loadAnnotations
  };
};
