-- Create policies to allow public access to projects and keyframes via share_id
-- First, drop existing policies that might conflict
DROP POLICY IF EXISTS "Public can view projects by share_id" ON public.projects;
DROP POLICY IF EXISTS "Public can view keyframes by project share_id" ON public.project_keyframes;

-- Allow public access to projects via share_id (no authentication required)
CREATE POLICY "Public can view projects by share_id" 
ON public.projects 
FOR SELECT 
USING (share_id IS NOT NULL);

-- Allow public access to keyframes for projects accessible via share_id
CREATE POLICY "Public can view keyframes by project share_id" 
ON public.project_keyframes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_keyframes.project_id 
  AND projects.share_id IS NOT NULL
));