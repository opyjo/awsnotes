"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./MobileMenu";

export const Header = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="border-b bg-background sticky top-0 z-30">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileMenu />
          <Link href="/dashboard" className="text-xl font-bold">
            AWS Study Notes
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/dashboard" className="text-sm hover:underline">
            Dashboard
          </Link>
          <Link href="/notes" className="text-sm hover:underline">
            Notes
          </Link>
          <Link href="/flashcards" className="text-sm hover:underline">
            Flashcards
          </Link>
        </nav>
        {user && (
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden md:inline text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
