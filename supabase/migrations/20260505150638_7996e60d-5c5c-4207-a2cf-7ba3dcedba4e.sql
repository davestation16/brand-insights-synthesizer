ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS response_count integer NOT NULL DEFAULT 0;