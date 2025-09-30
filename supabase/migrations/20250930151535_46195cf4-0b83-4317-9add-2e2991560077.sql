-- Tighten RLS policy for platform_reviews to prevent direct inserts
-- Only allow inserts through the Edge Function (which uses service role key)

-- Drop the existing public insert policy
DROP POLICY IF EXISTS "Anyone can insert reviews" ON platform_reviews;

-- Create a more restrictive policy that only allows service role
CREATE POLICY "Only service role can insert reviews"
ON platform_reviews
FOR INSERT
WITH CHECK (false);

-- Note: The Edge Function uses the service role key which bypasses RLS,
-- so it can still insert reviews after proper validation and rate limiting