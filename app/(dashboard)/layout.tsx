import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SessionProvider } from "@/components/providers/session-provider";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--c-bg)" }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
