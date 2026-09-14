-- Create evidence bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', false) ON CONFLICT DO NOTHING;

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for storage.objects for evidence bucket
DROP POLICY IF EXISTS "Tenant Isolation Policy SELECT Objects" ON storage.objects;
CREATE POLICY "Tenant Isolation Policy SELECT Objects" ON storage.objects FOR SELECT 
USING (
  bucket_id = 'evidence' AND 
  split_part(name, '/', 1) IN (SELECT id::text FROM public.organizations WHERE id IN (SELECT public.get_user_organizations()))
);

DROP POLICY IF EXISTS "Tenant Isolation Policy INSERT Objects" ON storage.objects;
CREATE POLICY "Tenant Isolation Policy INSERT Objects" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'evidence' AND 
  split_part(name, '/', 1) IN (SELECT id::text FROM public.organizations WHERE id IN (SELECT public.get_user_organizations()))
);

DROP POLICY IF EXISTS "Tenant Isolation Policy DELETE Objects" ON storage.objects;
CREATE POLICY "Tenant Isolation Policy DELETE Objects" ON storage.objects FOR DELETE 
USING (
  bucket_id = 'evidence' AND 
  split_part(name, '/', 1) IN (SELECT id::text FROM public.organizations WHERE id IN (SELECT public.get_user_organizations()))
);
