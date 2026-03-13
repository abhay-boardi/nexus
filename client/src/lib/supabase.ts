import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://jlgstbucwawuntatrgvy.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZ3N0YnVjd2F3dW50YXRyZ3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTE1MjgsImV4cCI6MjA4ODkyNzUyOH0.XSFwKsFnErnPB9nDZXW3QrKPVsthE0Dqa43WaQ9gDNY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
