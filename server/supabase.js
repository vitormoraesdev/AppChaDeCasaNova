import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config()

if(!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY){
  throw new Error("SUPABASE_URL e SUPABASE_KEY devem estar definidas no .env")
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default supabase