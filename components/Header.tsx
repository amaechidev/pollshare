// components/Header.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="container mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white"
          >
            <Sparkles className="h-6 w-6 text-blue-500" />
            Poll App
          </Link>
          {/* Add more navigation links here if needed */}
        </div>
        <nav className="flex items-center gap-2">
          {/* Placeholder for auth/user specific links */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/register">Register</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
