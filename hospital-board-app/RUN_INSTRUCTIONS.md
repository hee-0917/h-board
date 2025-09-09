# 병원 직원 게시판 실행 가이드

## 🚀 로컬 환경에서 실행하기 (권장)

### 1. 프로젝트 다운로드
```bash
# 이 폴더를 로컬 컴퓨터로 복사
```

### 2. 의존성 설치
```bash
cd hospital-board-app
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용 입력:

```env
# Supabase (실제 값으로 교체 필요)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Next.js
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 🔧 현재 환경에서 실행 시도하기

### 방법 1: 폴링 모드로 실행
```bash
WATCHPACK_POLLING=true npm run dev
```

### 방법 2: 환경 변수와 함께 실행
```bash
NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy_key npm run dev
```

### 방법 3: 프로덕션 빌드로 실행
```bash
npm run build
npm run start
```

## ⚠️ 현재 환경 제약사항

- 파일 감시 제한으로 개발 서버 실행이 어려울 수 있음
- 이는 컨테이너 환경의 시스템 제한사항
- 로컬 환경에서는 정상 작동함

## 🔐 테스트 계정

| 사번 | 비밀번호 | 이름 | 부서 |
|------|----------|------|------|
| EMP001 | password123 | 김의사 | 의료진 |
| EMP002 | password123 | 이간호사 | 의료진 |
| EMP003 | password123 | 박관리자 | 행정팀 |
| EMP004 | password123 | 최약사 | 약제팀 |

## 📁 주요 파일 구조

```
hospital-board-app/
├── src/
│   ├── app/
│   │   ├── login/page.tsx          # 로그인 페이지
│   │   ├── dashboard/page.tsx      # 대시보드
│   │   └── layout.tsx              # 루트 레이아웃
│   ├── lib/supabase/              # Supabase 설정
│   ├── store/auth.ts              # 상태 관리
│   └── types/database.ts          # 타입 정의
├── supabase/migrations/           # 데이터베이스 스키마
└── package.json                   # 의존성 및 스크립트
```



