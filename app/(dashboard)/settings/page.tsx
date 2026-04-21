import { redirect } from "next/navigation";

// Settings is now a slide-in drawer accessed from the sidebar.
// Direct URL visits are redirected to the dashboard.
export default function SettingsPage() {
  redirect("/dashboard");
}
