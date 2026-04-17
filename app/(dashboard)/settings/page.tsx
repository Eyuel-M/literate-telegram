import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="animate-fade-in">
      <div className="px-8 py-7 border-b border-[#1e1e2e]">
        <h1 className="text-xl font-semibold text-[#f0f0f8] tracking-tight">Settings</h1>
        <p className="text-sm text-[#6b6b85] mt-0.5">Manage your account and workspace</p>
      </div>

      <div className="px-8 py-6 max-w-lg">
        <div className="card p-6 mb-4">
          <h2 className="text-sm font-semibold text-[#f0f0f8] mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#6b6b85] mb-1">Name</label>
              <input className="input" defaultValue={session?.user?.name ?? ""} disabled />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b6b85] mb-1">Email</label>
              <input className="input" defaultValue={session?.user?.email ?? ""} disabled />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-[#f0f0f8] mb-4">About Forma</h2>
          <div className="space-y-2 text-xs text-[#6b6b85]">
            <p>Version 0.1.0 — MVP</p>
            <p>Creative Workflow OS for branding designers</p>
            <p className="text-[#3a3a50] mt-4">
              Built with Next.js 14, Prisma, SQLite, and Tailwind CSS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
