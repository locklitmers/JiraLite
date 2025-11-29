# Jira Lite

A lightweight issue management web application built with modern technologies.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.14-teal)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)

## Features

- 🔐 **Authentication** - Email/password and Google OAuth via Supabase
- 👥 **Teams** - Create teams, invite members, manage roles
- 📁 **Projects** - Organize work into projects with custom statuses
- 📋 **Kanban Board** - Drag-and-drop issue management
- 📝 **Rich Text Editor** - TipTap-powered issue descriptions
- 💬 **Comments** - Collaborate with team members
- 📊 **Activity Log** - Track all changes to issues
- 🤖 **AI Insights** - OpenAI-powered summaries and suggestions
- 🔔 **Real-time Notifications** - Stay updated with Supabase Realtime
- 🌙 **Dark Mode** - Beautiful light and dark themes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **UI**: Shadcn UI + Tailwind CSS
- **Validation**: Zod
- **Editor**: TipTap
- **Drag & Drop**: @hello-pangea/dnd
- **AI**: OpenAI GPT-3.5

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key (optional, for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/jira-lite.git
cd jira-lite
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# OpenAI (optional)
OPENAI_API_KEY=your-openai-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
```

5. (Optional) Seed the database with demo data:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
├── app/
│   ├── (dashboard)/      # Protected routes
│   │   ├── dashboard/    # Dashboard page
│   │   ├── projects/     # Projects & Kanban
│   │   ├── teams/        # Team management
│   │   ├── notifications/# Notifications
│   │   └── settings/     # User settings
│   ├── auth/             # Authentication
│   └── api/              # API routes
├── components/
│   ├── ui/               # Shadcn UI components
│   ├── layout/           # Layout components
│   ├── editor/           # TipTap editor
│   └── notifications/    # Notification components
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── auth/             # Auth utilities
│   ├── validations/      # Zod schemas
│   └── utils.ts          # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
└── styles/
    └── globals.css       # Global styles
```

## Database Schema

- **User** - User accounts
- **Team** - Team organizations
- **TeamMember** - Team membership with roles
- **TeamInvite** - Pending team invitations
- **Project** - Projects within teams
- **IssueStatus** - Kanban column statuses
- **Issue** - Issue tracking
- **IssueComment** - Issue comments
- **IssueActivity** - Activity log
- **Notification** - User notifications
- **AICache** - Cached AI responses

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy!

The `vercel.json` is already configured for optimal deployment.

### Database Migrations

For production, use Prisma migrations:
```bash
npm run db:migrate:deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://prisma.io/)
- [Supabase](https://supabase.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [TipTap](https://tiptap.dev/)

