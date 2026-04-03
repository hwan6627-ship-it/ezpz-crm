# EZPZ CRM - Supabase DB 구축 + Cloudflare 배포 가이드

> 개발 경험이 없는 분을 위한 단계별 안내서입니다.
> 모든 과정을 스크린샷 찍듯 세세하게 설명합니다.

---

## 전체 흐름 요약

```
1. Supabase에서 무료 DB 만들기 (데이터 저장소)
2. DB 테이블 만들기 (고객 정보 저장 구조)
3. React 코드에 Supabase 연결하기
4. Cloudflare Pages에 배포하기 (웹사이트 공개)
```

---

## Part 1: Supabase 데이터베이스 구축

### 1-1. Supabase 회원가입

1. 브라우저에서 **https://supabase.com** 접속
2. 오른쪽 위 **"Start your project"** 클릭
3. **"Sign up with GitHub"** 클릭 (GitHub 계정이 없으면 먼저 https://github.com 에서 가입)
4. GitHub 로그인 후 Supabase 접근 허용

### 1-2. 새 프로젝트 만들기

1. 로그인 후 **"New Project"** 클릭
2. 아래 내용 입력:
   - **Organization**: 기본값 그대로
   - **Project name**: `ezpz-crm`
   - **Database Password**: 비밀번호 입력 (메모해두세요! 나중에 필요합니다)
   - **Region**: `Northeast Asia (Tokyo)` 선택 (한국에서 가장 빠름)
3. **"Create new project"** 클릭
4. 2~3분 정도 기다리면 프로젝트가 생성됩니다

### 1-3. DB 테이블 만들기

프로젝트가 생성되면:

1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭 (데이터베이스 아이콘)
2. **"New query"** 클릭
3. 아래 SQL 코드를 **전체 복사**해서 붙여넣기:

```sql
-- ===== 계정 테이블 =====
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  login_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 관리자 계정 추가
INSERT INTO accounts (username, login_id, password, role)
VALUES ('관리자', 'admin', 'admin1234', 'admin');

-- ===== 고객 테이블 =====
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  ezpz_status TEXT DEFAULT '견적만 완료',
  ezpz_date TIMESTAMPTZ DEFAULT NOW(),
  crm_status TEXT DEFAULT '미등록',
  assignee TEXT DEFAULT '',
  estimate_count INTEGER DEFAULT 1,
  first_filter TEXT DEFAULT '미진행',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 영업 히스토리 테이블 =====
CREATE TABLE actions (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
  action_date TIMESTAMPTZ DEFAULT NOW(),
  action_type TEXT NOT NULL,
  note TEXT,
  author TEXT,
  file_name TEXT,
  file_type TEXT,
  file_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 인덱스 (검색 속도 향상) =====
CREATE INDEX idx_customers_crm_status ON customers(crm_status);
CREATE INDEX idx_customers_ezpz_status ON customers(ezpz_status);
CREATE INDEX idx_customers_ezpz_date ON customers(ezpz_date);
CREATE INDEX idx_actions_customer_id ON actions(customer_id);

-- ===== RLS (Row Level Security) 비활성화 =====
-- 내부 관리 시스템이므로 간단하게 설정
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 접근 가능하도록 정책 추가
CREATE POLICY "Allow all for anon" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON actions FOR ALL USING (true) WITH CHECK (true);

-- anon 키로도 접근 가능하도록
ALTER TABLE accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
ALTER TABLE actions FORCE ROW LEVEL SECURITY;

-- anon 역할에 권한 부여
GRANT ALL ON accounts TO anon;
GRANT ALL ON customers TO anon;
GRANT ALL ON actions TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
```

4. 왼쪽 아래 **"Run"** 버튼 클릭 (또는 Ctrl+Enter)
5. "Success. No rows returned" 메시지가 나오면 성공!

### 1-4. API 키 확인하기 (매우 중요!)

1. 왼쪽 메뉴에서 **"Project Settings"** (톱니바퀴 아이콘) 클릭
2. **"API"** 탭 클릭
3. 아래 두 가지를 메모장에 복사해두세요:

   - **Project URL**: `https://xxxxx.supabase.co` 형태
   - **anon (public) key**: `eyJhbGciOi...` 으로 시작하는 긴 문자열

> ⚠️ 이 두 값은 다음 단계에서 코드에 넣어야 합니다!

---

## Part 2: React 코드에 Supabase 연결하기

### 2-1. Supabase 라이브러리 설치

터미널(명령 프롬프트)에서 프로젝트 폴더로 이동한 뒤:

```bash
npm install @supabase/supabase-js
```

### 2-2. Supabase 연결 파일 만들기

`src/utils/` 폴더 안에 `supabase.js` 파일을 새로 만들고 아래 내용을 넣으세요.

**⚠️ 아래 두 줄의 값을 1-4단계에서 복사한 본인의 값으로 바꿔야 합니다!**

```javascript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://여기에-본인의-Project-URL을-넣으세요.supabase.co';
const SUPABASE_ANON_KEY = '여기에-본인의-anon-key를-넣으세요';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 2-3. 코드 수정 (데이터를 DB에서 읽고 쓰기)

이 부분은 Claude에게 요청하시면 됩니다. 예를 들어:

> "supabase.js 파일을 만들었어. 이제 App.jsx의 고객 데이터를
> localStorage 대신 Supabase DB에서 읽고 쓰도록 바꿔줘"

라고 요청하시면 코드를 수정해 드립니다.

---

## Part 3: Cloudflare Pages 배포

### 3-1. GitHub에 코드 올리기

먼저 코드를 GitHub에 올려야 합니다.

**GitHub 저장소 만들기:**
1. https://github.com 로그인
2. 오른쪽 위 **"+"** 버튼 → **"New repository"** 클릭
3. **Repository name**: `ezpz-crm` 입력
4. **Private** 선택 (비공개)
5. **"Create repository"** 클릭

**코드 업로드 (터미널에서):**

```bash
cd ezpz-crm-react

git init
git add .
git commit -m "첫 번째 커밋: EZPZ CRM"
git branch -M main
git remote add origin https://github.com/본인의GitHub아이디/ezpz-crm.git
git push -u origin main
```

> ⚠️ `본인의GitHub아이디` 부분을 실제 GitHub 아이디로 바꿔주세요!
> 처음이라면 GitHub 로그인 창이 뜰 수 있습니다. 로그인하세요.

### 3-2. Cloudflare 회원가입

1. https://dash.cloudflare.com/sign-up 접속
2. 이메일, 비밀번호 입력하고 가입
3. 이메일 인증 완료

### 3-3. Cloudflare Pages에 프로젝트 연결

1. Cloudflare 대시보드에서 왼쪽 메뉴 **"Workers & Pages"** 클릭
2. **"Create"** 클릭
3. **"Pages"** 탭 선택
4. **"Connect to Git"** 클릭
5. **"GitHub"** 선택 → GitHub 계정 연결 허용
6. 방금 만든 `ezpz-crm` 저장소 선택
7. **빌드 설정 입력:**

   | 항목 | 입력값 |
   |------|--------|
   | Framework preset | `None` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

8. **"Environment variables"** 를 클릭해서 아래 두 개를 추가:

   | Variable name | Value |
   |--------------|-------|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` (본인의 Supabase URL) |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (본인의 anon key) |

9. **"Save and Deploy"** 클릭
10. 1~2분 후 배포 완료!

### 3-4. 배포된 사이트 확인

배포가 끝나면 Cloudflare가 자동으로 주소를 생성합니다:

```
https://ezpz-crm.pages.dev
```

이 주소를 브라우저에 입력하면 CRM이 동작합니다!

### 3-5. 커스텀 도메인 연결 (선택사항)

본인의 도메인이 있다면:

1. Cloudflare Pages 프로젝트 → **"Custom domains"** 탭
2. **"Set up a custom domain"** 클릭
3. 도메인 입력 (예: `crm.mycompany.com`)
4. DNS 설정 안내에 따라 진행

---

## Part 4: 이후 업데이트 방법

코드를 수정한 후 다시 배포하려면:

```bash
cd ezpz-crm-react
git add .
git commit -m "업데이트 내용 설명"
git push
```

이렇게만 하면 Cloudflare가 자동으로 감지해서 다시 배포합니다! (1~2분 소요)

---

## 자주 묻는 질문

**Q: 비용이 드나요?**
- Supabase 무료 플랜: DB 500MB, 월 5만건 API 호출 (소규모 CRM에 충분)
- Cloudflare Pages: 무료 (월 500회 빌드, 무제한 트래픽)

**Q: 데이터가 안전한가요?**
- Supabase는 AWS 서버에 데이터를 저장합니다
- 백업은 Supabase 대시보드 > Database > Backups에서 확인 가능

**Q: 문제가 생기면?**
- Supabase 대시보드 > Logs에서 에러 확인
- Cloudflare Pages > Deployments에서 빌드 로그 확인

---

## 환경변수 보안 팁

코드에 API 키를 직접 넣는 대신, 환경변수 파일을 사용하세요.

프로젝트 폴더에 `.env` 파일 생성:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

그리고 `supabase.js`를 이렇게 수정:

```javascript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

> ⚠️ `.env` 파일은 절대 GitHub에 올리면 안 됩니다!
> 프로젝트 폴더에 `.gitignore` 파일을 열어서 `.env` 한 줄을 추가하세요.
