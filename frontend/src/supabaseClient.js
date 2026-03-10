import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = "https://gphsnymkscwykjwazjll.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwaHNueW1rc2N3eWtqd2F6amxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzYxMTksImV4cCI6MjA4Nzk1MjExOX0.vq2MADL1wrLNWIGrrb4xt8v5NTyrz0dBCShV8IMxv8o";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);