-- Create storage bucket for audiovisual projects
INSERT INTO storage.buckets (id, name, public)
VALUES ('audiovisual-projects', 'audiovisual-projects', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for audiovisual projects bucket
CREATE POLICY "Authenticated users can upload audiovisual files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audiovisual-projects');

CREATE POLICY "Public can view audiovisual files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audiovisual-projects');

CREATE POLICY "Users can update their own audiovisual files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'audiovisual-projects' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audiovisual files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'audiovisual-projects' AND auth.uid()::text = (storage.foldername(name))[1]);