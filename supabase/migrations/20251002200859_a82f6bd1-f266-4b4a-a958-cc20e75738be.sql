-- Add resent_at column to projects table for automatic "PROJETO REENVIADO" badge
ALTER TABLE projects ADD COLUMN resent_at timestamp with time zone;