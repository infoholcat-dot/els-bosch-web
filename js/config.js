// Substituir amb les claus del teu projecte Supabase
const SUPABASE_URL = 'https://eqwhkejwoaarguqaixeq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxd2hrZWp3b2Fhcmd1cWFpeGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTMzNTQsImV4cCI6MjA5OTM4OTM1NH0.yl2YMaxbLeQAVuwdplN4_ePqSYmNrM_6BSZcBFSqE-g';

const { createClient } = supabaseJs;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
