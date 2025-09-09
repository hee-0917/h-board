# 병원 직원 전용 게시판 시스템

Next.js와 Supabase를 사용한 병원 직원 전용 게시판 시스템입니다.

## 🚀 기능

- **사번 기반 인증**: 직원 사번과 비밀번호로 안전한 로그인
- **게시판 기능**: 전체 공지 및 부서별 공지 분리
- **긴급 알림**: 긴급 공지 우선 표시 및 푸시 알림
- **권한 관리**: 직원, 부서장, 관리자별 차등 권한
- **실시간 알림**: Supabase Realtime을 통한 실시간 업데이트
- **모바일 최적화**: 반응형 디자인 및 PWA 지원

## 🛠 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State Management**: Zustand
- **UI Components**: Shadcn/ui
- **Deployment**: Vercel

## 📋 설치 및 실행

### 1. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 2. 환경 변수 설정

\`.env.local\` 파일을 생성하고 다음 내용을 입력하세요:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Firebase Cloud Messaging (선택사항)
NEXT_PUBLIC_FCM_VAPID_KEY=your_fcm_vapid_key
FCM_SERVER_KEY=your_fcm_server_key

# Next.js
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
\`\`\`

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. \`supabase/migrations/001_initial_schema.sql\` 파일의 내용을 Supabase SQL Editor에서 실행
3. Authentication > Settings에서 다음 설정:
   - Enable email confirmations: OFF
   - Enable phone confirmations: OFF
   - 기타 필요한 인증 설정

### 4. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

http://localhost:3000에서 애플리케이션을 확인할 수 있습니다.

## 👥 테스트 계정

다음 테스트 계정으로 로그인할 수 있습니다:

| 사번 | 비밀번호 | 이름 | 부서 | 역할 |
|------|----------|------|------|------|
| EMP001 | password123 | 김의사 | 의료진 | 주치의 |
| EMP002 | password123 | 이간호사 | 의료진 | 수간호사 |
| EMP003 | password123 | 박관리자 | 행정팀 | 팀장 |
| EMP004 | password123 | 최약사 | 약제팀 | 약사 |

## 📱 주요 페이지

- **로그인**: `/login` - 사번과 비밀번호로 로그인
- **대시보드**: `/dashboard` - 최신 공지사항 및 긴급 알림 확인
- **전체 공지**: `/posts/all` - 모든 직원 대상 공지사항
- **부서별 공지**: `/posts/department` - 소속 부서 공지사항
- **게시글 작성**: `/posts/create` - 새 공지사항 작성
- **설정**: `/settings` - 프로필 및 알림 설정

## 🔐 보안 기능

- **Row Level Security (RLS)**: 데이터베이스 레벨에서 권한 제어
- **JWT 인증**: 안전한 세션 관리
- **비밀번호 해시**: bcrypt를 통한 비밀번호 암호화
- **CORS 설정**: 허용된 도메인에서만 접근 가능

## 📊 데이터베이스 스키마

주요 테이블:
- \`employees\`: 직원 정보
- \`departments\`: 부서 정보
- \`posts\`: 게시글
- \`notifications\`: 알림
- \`push_tokens\`: 푸시 알림 토큰

## 🚀 배포

### Vercel 배포

1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 설정
4. 자동 배포 완료

### 환경 변수 (프로덕션)

프로덕션 환경에서는 \`NEXTAUTH_URL\`을 실제 도메인으로 변경하세요.

## 📞 지원

개발 관련 문의나 버그 리포트는 개발팀에 연락주세요.

## 📄 라이선스

이 프로젝트는 병원 내부 사용을 위한 소프트웨어입니다.