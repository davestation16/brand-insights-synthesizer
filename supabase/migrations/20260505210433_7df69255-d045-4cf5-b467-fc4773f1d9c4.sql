
CREATE TABLE public.survey_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.survey_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read templates"
  ON public.survey_templates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can insert templates"
  ON public.survey_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update templates"
  ON public.survey_templates FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

INSERT INTO public.survey_templates (entity_type, content) VALUES
('Business', '{
  "personalityTraits": ["Carefree","Daring","Spirited","Down-to-earth","Honest","Communicative","Valuable","Transparent","Wholesome","Cheerful","Imaginative","Innovative","Reliable","Intelligent","Successful","Exclusive","Upper-class","Luxury","Charming","Outdoorsy","Tough","Brawny"],
  "perceptionTraits": ["Sincere","Exciting","Competent","Sophisticated","Rugged"],
  "valuesSpectrum": [
    {"id":"respect_power","left":"Respect","right":"Power","question":"Would {{name}} rather gain respect or power?"},
    {"id":"strength_transparency","left":"Strength","right":"Transparency","question":"Would {{name}} prefer to make decisions that make them appear strong at the sake of being transparent with others or vice versa?"},
    {"id":"admiration_attention","left":"Admiration","right":"Attention","question":"Would {{name}} rather gain admiration or attention?"},
    {"id":"original_tradition","left":"Original Thinking","right":"Tradition","question":"Does {{name}} lean more on original thinking or more on tradition?"},
    {"id":"passion_thoughtfulness","left":"Passion","right":"Thoughtfulness","question":"When making a decision, which of these would {{name}} rely on?"},
    {"id":"knowledge_experience","left":"Knowledge","right":"Experience","question":"When making a decision, which of these would {{name}} rely on?"}
  ],
  "aesthetics": {}
}'::jsonb),
('Organization', '{
  "personalityTraits": ["Carefree","Daring","Spirited","Down-to-earth","Honest","Communicative","Valuable","Transparent","Wholesome","Cheerful","Imaginative","Innovative","Reliable","Intelligent","Successful","Exclusive","Upper-class","Luxury","Charming","Outdoorsy","Tough","Brawny"],
  "perceptionTraits": ["Sincere","Exciting","Competent","Sophisticated","Rugged"],
  "valuesSpectrum": [
    {"id":"leadership","left":"Clear","right":"Deeply Approachable","question":"Where does {{name}} primarily position its leadership?"},
    {"id":"beliefs","left":"Unwavering","right":"Profound Openness","question":"How does {{name}} approach its core beliefs and the outside world?"},
    {"id":"driver","left":"Striving","right":"Committed to Service","question":"What is the primary driver of {{name}}''s activities and focus?"},
    {"id":"tradition","left":"Embracing Change","right":"Upholding Heritage","question":"Where does {{name}} stand on tradition and change?"},
    {"id":"tone","left":"Energetic","right":"Quiet Calm","question":"What is the primary atmosphere or tone of {{name}}?"},
    {"id":"focus","left":"Focus on Truth","right":"Focus on Relationship","question":"What is the main focus of community life at {{name}}?"}
  ],
  "aesthetics": {
    "palette": [
      {"name":"Neon","colors":["#482EF7","#FFEB3B","#90CAF9","#E69AC1","#FF6D62"]},
      {"name":"Bright","colors":["#484D9F","#5577DB","#DBD655","#8E249F","#E44EDB"]},
      {"name":"Faded","colors":["#D1C497","#D0B59B","#ABA290","#A18865","#8F727F"]},
      {"name":"Neutral","colors":["#3D505B","#9CA3B1","#D3D2C4","#877C73","#44474D"]},
      {"name":"Muted","colors":["#422D2F","#7A8366","#D6CCAD","#DC8C74","#D8695A"]}
    ],
    "material": [
      {"name":"Metal","image":"https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=600"},
      {"name":"Fabric","image":"https://images.unsplash.com/photo-1583338917451-acad6eb500c5?auto=format&fit=crop&q=80&w=600"},
      {"name":"Leather","image":"https://images.unsplash.com/photo-1524292332709-3551400587d5?auto=format&fit=crop&q=80&w=600"},
      {"name":"Stone","image":"https://images.unsplash.com/photo-1517594422361-5eeb8ae275a9?auto=format&fit=crop&q=80&w=600"},
      {"name":"Wood","image":"https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=600"}
    ],
    "house": [
      {"name":"Neoclassical","image":"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600"},
      {"name":"Tudor","image":"https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=600"},
      {"name":"Art Deco","image":"https://images.unsplash.com/photo-1481026469463-66327c86e544?auto=format&fit=crop&q=80&w=600"},
      {"name":"Craftsman","image":"https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=600"},
      {"name":"Modern","image":"https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&q=80&w=600"}
    ],
    "vehicle": [
      {"name":"Sports Car","image":"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600"},
      {"name":"Truck","image":"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600"},
      {"name":"Minivan","image":"https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=600"},
      {"name":"Sedan","image":"https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=600"},
      {"name":"ATV","image":"https://images.unsplash.com/photo-1549448512-29fc2a2982d6?auto=format&fit=crop&q=80&w=600"},
      {"name":"Bicycle","image":"https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600"}
    ],
    "dress": [
      {"name":"Casual","image":"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600"},
      {"name":"Sporty","image":"https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=600"},
      {"name":"Work Clothes","image":"https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600"},
      {"name":"Stylish","image":"https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&q=80&w=600"},
      {"name":"White Collar","image":"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600"},
      {"name":"Formal","image":"https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600"}
    ]
  }
}'::jsonb);
