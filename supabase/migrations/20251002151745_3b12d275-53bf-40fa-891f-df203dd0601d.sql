-- Criar bucket para anotações de vídeo
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-annotations',
  'video-annotations',
  true,
  10485760, -- 10MB
  ARRAY['image/webp', 'image/png', 'image/jpeg']
);

-- Políticas RLS para o bucket video-annotations
CREATE POLICY "Public can upload annotations"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'video-annotations');

CREATE POLICY "Public can view annotations"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'video-annotations');

CREATE POLICY "Public can delete annotations"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'video-annotations');