import { createClient } from '@supabase/supabase-js';

// .env 파일에서 환경변수를 읽어옵니다
// .env 파일에 아래 두 값을 본인의 Supabase 프로젝트 값으로 설정하세요:
//   VITE_SUPABASE_URL=https://xxxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
