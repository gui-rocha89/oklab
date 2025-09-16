-- Create function to automatically promote first admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Check if this is the first user (gui@streamlab.com.br) and make them supreme_admin
  IF NEW.email = 'gui@streamlab.com.br' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'supreme_admin');
  ELSE
    -- Assign default role as 'user' for other users
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;