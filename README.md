# Jira Lite

A modern, lightweight issue management application inspired by Jira. Built with Next.js 14, Prisma, Supabase, and Shadcn UI.

![Jira Lite](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)
![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase)

## ✨ Features

### 🔐 Authentication
- Email/Password authentication with email verification
- Google OAuth integration
- Password reset via email
- Session management

### 👥 Team Management
- Create and manage teams
- Invite members via email
- Role-based access control (Owner, Admin, Member)
- Transfer team ownership
- Team activity logs

### 📋 Project Management
- Create projects within teams
- Customizable Kanban board statuses
- Project archiving and restoration
- Favorite projects for quick access
- Project-level labels/tags

### 📝 Issue Tracking
- Create, edit, and delete issues
- Drag-and-drop Kanban board
- Issue types: Task, Bug, Story, Epic
- Priority levels: Urgent, High, Medium, Low
- Assignee management
- Due date tracking with notifications
- Subtasks/Checklist support
- Rich text descriptions with TipTap editor
- Issue comments with editing
- Issue labels/tags
- Activity history

### 🤖 AI Features (Powered by Groq)
- **AI Summary**: Auto-generate issue summaries
- **AI Suggestions**: Get AI-powered suggestions for issues
- **AI Auto-Label**: Suggest labels based on issue content
- **AI Duplicate Detection**: Warn about similar existing issues
- **Discussion Summary**: Summarize comment threads (5+ comments)
- Rate limiting: 10 requests/minute per user

### 🔔 Notifications
- In-app notifications
- Email notifications via Nodemailer
- Due date reminders (1 day before)
- Role change notifications
- Team invitation notifications

### 📊 Analytics
- Project dashboard with statistics
- Team statistics and performance metrics
- Issue trends visualization

### 🎨 UI/UX
- Modern, responsive design
- Dark/Light theme support
- Mobile-friendly interface
- Loading skeletons
- Toast notifications

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Email**: Nodemailer
- **AI**: Groq API (Llama 3.3)
- **Drag & Drop**: @hello-pangea/dnd
- **Rich Text Editor**: TipTap

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Groq API key (for AI features)
- Gmail account (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jira-lite.git
   cd jira-lite
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in the following variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Database
   DATABASE_URL=postgresql://...?pgbouncer=true
   DIRECT_URL=postgresql://...
   
   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Email (Gmail)
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASSWORD=your_app_password
   
   # AI (Groq)
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Supabase Configuration

1. **Enable Email Provider** in Authentication > Providers
2. **Disable "Confirm email"** (we use custom email verification)
3. **Enable Google OAuth** (optional) with Client ID and Secret
4. **Configure redirect URLs** in Authentication > URL Configuration

### Gmail App Password

1. Enable 2-Step Verification on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this password as `SMTP_PASSWORD`

## 📁 Project Structure

```
jira_lite/
├── app/
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── dashboard/    # Main dashboard
│   │   ├── projects/     # Project management
│   │   ├── teams/        # Team management
│   │   ├── notifications/# Notifications
│   │   └── settings/     # User settings
│   ├── auth/             # Authentication pages
│   └── api/              # API routes
├── components/
│   ├── layout/           # Layout components
│   ├── ui/               # Shadcn UI components
│   └── editor/           # TipTap editor
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── validations/      # Zod schemas
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## 🔧 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npx prisma studio # Open Prisma Studio
npx prisma db push # Push schema changes
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

# Jira Lite (한국어)

Jira에서 영감을 받은 현대적이고 가벼운 이슈 관리 애플리케이션입니다. Next.js 14, Prisma, Supabase, Shadcn UI로 구축되었습니다.

## ✨ 기능

### 🔐 인증
- 이메일 인증을 통한 이메일/비밀번호 인증
- Google OAuth 통합
- 이메일을 통한 비밀번호 재설정
- 세션 관리

### 👥 팀 관리
- 팀 생성 및 관리
- 이메일로 멤버 초대
- 역할 기반 접근 제어 (소유자, 관리자, 멤버)
- 팀 소유권 이전
- 팀 활동 로그

### 📋 프로젝트 관리
- 팀 내 프로젝트 생성
- 커스터마이징 가능한 칸반 보드 상태
- 프로젝트 아카이브 및 복원
- 빠른 접근을 위한 즐겨찾기 프로젝트
- 프로젝트 레벨 라벨/태그

### 📝 이슈 추적
- 이슈 생성, 편집, 삭제
- 드래그 앤 드롭 칸반 보드
- 이슈 유형: 작업, 버그, 스토리, 에픽
- 우선순위: 긴급, 높음, 보통, 낮음
- 담당자 관리
- 마감일 추적 및 알림
- 하위 작업/체크리스트 지원
- TipTap 에디터를 통한 리치 텍스트 설명
- 편집 가능한 이슈 댓글
- 이슈 라벨/태그
- 활동 이력

### 🤖 AI 기능 (Groq 기반)
- **AI 요약**: 이슈 요약 자동 생성
- **AI 제안**: 이슈에 대한 AI 기반 제안
- **AI 자동 라벨**: 이슈 내용 기반 라벨 제안
- **AI 중복 감지**: 유사한 기존 이슈 경고
- **토론 요약**: 댓글 스레드 요약 (5개 이상 댓글)
- 속도 제한: 사용자당 분당 10개 요청

### 🔔 알림
- 앱 내 알림
- Nodemailer를 통한 이메일 알림
- 마감일 알림 (1일 전)
- 역할 변경 알림
- 팀 초대 알림

### 📊 분석
- 통계가 포함된 프로젝트 대시보드
- 팀 통계 및 성과 지표
- 이슈 트렌드 시각화

### 🎨 UI/UX
- 현대적이고 반응형 디자인
- 다크/라이트 테마 지원
- 모바일 친화적 인터페이스
- 로딩 스켈레톤
- 토스트 알림

## 🛠️ 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **데이터베이스**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **인증**: Supabase Auth
- **UI 컴포넌트**: Shadcn UI
- **스타일링**: Tailwind CSS
- **유효성 검사**: Zod
- **이메일**: Nodemailer
- **AI**: Groq API (Llama 3.3)
- **드래그 앤 드롭**: @hello-pangea/dnd
- **리치 텍스트 에디터**: TipTap

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 pnpm
- Supabase 계정
- Groq API 키 (AI 기능용)
- Gmail 계정 (이메일 알림용)

### 설치

1. **저장소 클론**
   ```bash
   git clone https://github.com/yourusername/jira-lite.git
   cd jira-lite
   ```

2. **의존성 설치**
   ```bash
   npm install
   # 또는
   pnpm install
   ```

3. **환경 변수 설정**
   ```bash
   cp .env.example .env
   ```

   다음 변수들을 채워주세요:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # 데이터베이스
   DATABASE_URL=postgresql://...?pgbouncer=true
   DIRECT_URL=postgresql://...
   
   # 앱
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # 이메일 (Gmail)
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASSWORD=your_app_password
   
   # AI (Groq)
   GROQ_API_KEY=your_groq_api_key
   ```

4. **데이터베이스 설정**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

6. **브라우저 열기**
   [http://localhost:3000](http://localhost:3000)으로 이동

### Supabase 설정

1. Authentication > Providers에서 **이메일 제공자 활성화**
2. **"이메일 확인" 비활성화** (커스텀 이메일 인증 사용)
3. Client ID와 Secret으로 **Google OAuth 활성화** (선택사항)
4. Authentication > URL Configuration에서 **리다이렉트 URL 설정**

### Gmail 앱 비밀번호

1. Google 계정에서 2단계 인증 활성화
2. [Google 앱 비밀번호](https://myaccount.google.com/apppasswords)로 이동
3. "메일"용 새 앱 비밀번호 생성
4. 이 비밀번호를 `SMTP_PASSWORD`로 사용

## 📁 프로젝트 구조

```
jira_lite/
├── app/
│   ├── (dashboard)/      # 보호된 대시보드 라우트
│   │   ├── dashboard/    # 메인 대시보드
│   │   ├── projects/     # 프로젝트 관리
│   │   ├── teams/        # 팀 관리
│   │   ├── notifications/# 알림
│   │   └── settings/     # 사용자 설정
│   ├── auth/             # 인증 페이지
│   └── api/              # API 라우트
├── components/
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── ui/               # Shadcn UI 컴포넌트
│   └── editor/           # TipTap 에디터
├── lib/
│   ├── supabase/         # Supabase 클라이언트
│   ├── validations/      # Zod 스키마
│   └── utils.ts          # 유틸리티 함수
├── prisma/
│   └── schema.prisma     # 데이터베이스 스키마
└── public/               # 정적 자산
```

## 🔧 사용 가능한 스크립트

```bash
npm run dev       # 개발 서버 시작
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 서버 시작
npm run lint      # ESLint 실행
npx prisma studio # Prisma Studio 열기
npx prisma db push # 스키마 변경 푸시
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스에 따라 라이선스가 부여됩니다.

## 🤝 기여

기여를 환영합니다! Pull Request를 자유롭게 제출해 주세요.
