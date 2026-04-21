export const dynamic = "force-dynamic";

import { CalendarClient } from "@/components/calendar/calendar-client";

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-full px-8 py-7 animate-fade-in">
      <CalendarClient />
    </div>
  );
}
