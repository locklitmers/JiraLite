import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Kanban, Users, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Kanban className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Jira Lite</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-8">
          <Zap className="w-4 h-4" />
          <span>Lightweight & Powerful Issue Tracking</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Manage Issues
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Without the Complexity
          </span>
        </h1>
        
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
          A streamlined issue management tool that helps teams organize, track, 
          and resolve issues efficiently. Built for speed and simplicity.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-lg px-8 py-6">
              Start Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-6">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <Kanban className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Kanban Boards</h3>
            <p className="text-slate-400">
              Visualize your workflow with drag-and-drop Kanban boards. 
              Move issues between columns effortlessly.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Team Collaboration</h3>
            <p className="text-slate-400">
              Work together with your team. Assign issues, leave comments, 
              and track progress in real-time.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Insights</h3>
            <p className="text-slate-400">
              Get smart summaries, auto-tagging, and improvement suggestions 
              powered by artificial intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8">
        <div className="container mx-auto px-6 text-center text-slate-500">
          <p>© 2024 Jira Lite. Built with Next.js, Prisma, and Supabase.</p>
        </div>
      </footer>
    </div>
  );
}

