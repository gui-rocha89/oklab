-- Remover todas as anotações visuais
DELETE FROM video_annotations;

-- Remover a tabela de anotações visuais
DROP TABLE IF EXISTS video_annotations CASCADE;

-- Remover políticas de storage para video-annotations
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;

-- Remover objetos do bucket
DELETE FROM storage.objects WHERE bucket_id = 'video-annotations';

-- Remover o bucket de anotações
DELETE FROM storage.buckets WHERE id = 'video-annotations';