export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatClient } from "@/components/chat/chat-client";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <ChatClient currentUserId={userId} />
    </div>
  );
}
