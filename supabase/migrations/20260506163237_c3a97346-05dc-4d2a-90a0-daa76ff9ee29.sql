
INSERT INTO storage.buckets (id, name, public)
VALUES ('survey_images', 'survey_images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read survey images"
ON storage.objects FOR SELECT
USING (bucket_id = 'survey_images');

CREATE POLICY "Admins can upload survey images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'survey_images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update survey images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'survey_images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete survey images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'survey_images' AND has_role(auth.uid(), 'admin'::app_role));
