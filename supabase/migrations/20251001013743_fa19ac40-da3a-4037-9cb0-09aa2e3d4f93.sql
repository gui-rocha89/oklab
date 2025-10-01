-- Corrigir projeto órfão com status uploading e sem video_url
UPDATE projects 
SET status = 'error' 
WHERE id = '37c367e3-5cb6-43c7-8072-81f9dce328d9' 
  AND status = 'uploading' 
  AND video_url IS NULL;