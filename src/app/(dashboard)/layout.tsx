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
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
