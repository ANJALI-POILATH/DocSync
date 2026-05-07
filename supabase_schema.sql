-- Create the projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  "documentType" text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  requirements jsonb DEFAULT '[]'::jsonb,
  sections jsonb DEFAULT '[]'::jsonb
);

-- Set up Row Level Security (RLS)
-- Note: These policies are permissive for demonstration. 
-- In a real production app, you would restrict these based on auth.uid()
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.projects FOR DELETE USING (true);
