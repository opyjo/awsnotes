import { AuthGuard } from "@/components/layout/AuthGuard";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen flex-col bg-gradient-to-br from-blue-50/30 via-background to-blue-100/20 dark:from-blue-950/20 dark:via-background dark:to-blue-900/10">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.12),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(96,165,250,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(96,165,250,0.1),transparent_50%)] pointer-events-none" />
            <div className="relative z-10">{children}</div>
          </main>
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
