import { Kanban } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Kanban className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Jira Lite</span>
        </Link>
        
        <div className="space-y-6">
          <blockquote className="text-2xl font-medium text-white/90 leading-relaxed">
            &ldquo;The simplest way to manage issues and track progress. 
            Our team productivity increased by 40% after switching.&rdquo;
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full" />
            <div>
              <p className="font-semibold text-white">Sarah Chen</p>
              <p className="text-white/60">Engineering Lead at TechCorp</p>
            </div>
          </div>
        </div>
        
        <p className="text-white/40 text-sm">
          © 2024 Jira Lite. All rights reserved.
        </p>
      </div>
      
      {/* Right side - Auth forms */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

