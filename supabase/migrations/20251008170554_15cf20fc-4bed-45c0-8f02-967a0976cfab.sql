-- Create review_assets table
CREATE TABLE public.review_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_url TEXT NOT NULL,
  duration NUMERIC NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_review' CHECK (status IN ('in_review', 'changes_requested', 'approved')),
  share_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create threads table
CREATE TABLE public.threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.review_assets(id) ON DELETE CASCADE,
  chip INTEGER NOT NULL,
  t_start NUMERIC NOT NULL,
  t_end NUMERIC,
  shapes JSONB NOT NULL DEFAULT '[]'::jsonb,
  state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create thread_comments table
CREATE TABLE public.thread_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_assets
CREATE POLICY "Public can view assets by share_token"
  ON public.review_assets
  FOR SELECT
  USING (share_token IS NOT NULL);

CREATE POLICY "Authenticated users can manage their assets"
  ON public.review_assets
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for threads
CREATE POLICY "Public can view threads from shared assets"
  ON public.threads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.review_assets
      WHERE review_assets.id = threads.asset_id
      AND review_assets.share_token IS NOT NULL
    )
  );

CREATE POLICY "Authenticated users can manage threads"
  ON public.threads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.review_assets
      WHERE review_assets.id = threads.asset_id
      AND auth.uid() IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.review_assets
      WHERE review_assets.id = threads.asset_id
      AND auth.uid() IS NOT NULL
    )
  );

-- RLS Policies for thread_comments
CREATE POLICY "Public can view comments from shared assets"
  ON public.thread_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.threads
      JOIN public.review_assets ON review_assets.id = threads.asset_id
      WHERE threads.id = thread_comments.thread_id
      AND review_assets.share_token IS NOT NULL
    )
  );

CREATE POLICY "Anyone can add comments to shared threads"
  ON public.thread_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.threads
      JOIN public.review_assets ON review_assets.id = threads.asset_id
      WHERE threads.id = thread_comments.thread_id
      AND review_assets.share_token IS NOT NULL
    )
  );

CREATE POLICY "Authenticated users can manage comments"
  ON public.thread_comments
  FOR ALL
  USING (auth.uid() = author_id OR auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_threads_asset_id ON public.threads(asset_id);
CREATE INDEX idx_thread_comments_thread_id ON public.thread_comments(thread_id);
CREATE INDEX idx_review_assets_share_token ON public.review_assets(share_token);

-- Create trigger for updated_at
CREATE TRIGGER update_review_assets_updated_at
  BEFORE UPDATE ON public.review_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON public.threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();