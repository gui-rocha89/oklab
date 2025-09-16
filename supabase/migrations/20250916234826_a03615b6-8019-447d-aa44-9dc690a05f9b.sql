-- Create platform_reviews table for client satisfaction ratings
CREATE TABLE public.platform_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  client_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for platform_reviews
CREATE POLICY "Project owners and managers can view reviews" 
ON public.platform_reviews 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = platform_reviews.project_id 
    AND (projects.user_id = auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role]))
  )
);

CREATE POLICY "Anyone can insert reviews" 
ON public.platform_reviews 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_platform_reviews_updated_at
BEFORE UPDATE ON public.platform_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_platform_reviews_project_id ON public.platform_reviews(project_id);
CREATE INDEX idx_platform_reviews_rating ON public.platform_reviews(rating);