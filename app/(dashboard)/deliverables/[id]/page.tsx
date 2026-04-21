import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDuration, formatRelative, STATUS_LABELS, STATUS_COLORS, DELIVERABLE_TYPES } from "@/lib/utils";
import { ArrowLeft, Clock, Plus, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { VersionTimeline } from "@/components/deliverables/version-timeline";
import { FeedbackThread } from "@/components/deliverables/feedback-thread";
import { NewVersionButton } from "@/components/deliverables/new-version-button";
import { TimeLogButton } from "@/components/time/time-log-button";

async function getDeliverable(id: string, workspaceId: string) {
  return prisma.deliverable.findFirst({
    where: { id, project: { client: { workspaceId } } },
    include: {
      project: {
        include: {
          client: { select: { id: true, name: true, color: true } },
        },
      },
      versions: {
        orderBy: { number: "asc" },
        include: {
          assets: { orderBy: { createdAt: "asc" } },
          feedback: {
            orderBy: { createdAt: "asc" },
            include: { replies: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
      timeEntries: {
        select: { duration: true, date: true, description: true },
        orderBy: { date: "desc" },
      },
    },
  });
}

export default async function DeliverablePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { workspaceId } = session!.user as { id: string; workspaceId: string };
  const d = await getDeliverable(params.id, workspaceId);
  if (!d) notFound();

  const latestVersion = d.versions[d.versions.length - 1];
  const totalMinutes = d.timeEntries.reduce((s, e) => s + e.duration, 0);
  const typeLabel = DELIVERABLE_TYPES.find((t) => t.value === d.type)?.label ?? d.type;
  const totalFeedback = d.versions.reduce((s, v) => s + v.feedback.length, 0);
  const unresolvedFeedback = d.versions.reduce(
    (s, v) => s + v.feedback.filter((f) => !f.resolved).length,
    0
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-8 py-7 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2 text-xs text-[#6b6b85] mb-4">
          <Link href={`/clients/${d.project.client.id}`} className="hover:text-[#f0f0f8] transition-colors">
            {d.project.client.name}
          </Link>
          <span className="text-[#3a3a50]">/</span>
          <Link href={`/projects/${d.project.id}`} className="hover:text-[#f0f0f8] transition-colors">
            {d.project.name}
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-[#6b6b85] bg-[#1a1a2e] px-2 py-0.5 rounded-md">{typeLabel}</span>
              <span className={`badge text-[10px] ${STATUS_COLORS[d.status]}`}>{STATUS_LABELS[d.status]}</span>
            </div>
            <h1 className="text-xl font-semibold text-[#f0f0f8] tracking-tight">{d.name}</h1>
            {d.description && <p className="text-sm text-[#6b6b85] mt-1">{d.description}</p>}

            <div className="flex items-center gap-5 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-[#6b6b85]">
                <Clock size={12} /> {formatDuration(totalMinutes)} logged
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#6b6b85]">
                <MessageSquare size={12} /> {totalFeedback} comments
                {unresolvedFeedback > 0 && (
                  <span className="text-amber-400">({unresolvedFeedback} open)</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#6b6b85]">
                {d.versions.length} version{d.versions.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TimeLogButton deliverableId={d.id} projectId={d.project.id} />
            <NewVersionButton deliverableId={d.id} />
          </div>
        </div>
      </div>

      {/* Version Timeline + Content */}
      {d.versions.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <div className="card p-10 max-w-md mx-auto">
            <div className="text-3xl mb-3">✦</div>
            <h3 className="font-semibold text-[#f0f0f8] mb-2">No versions yet</h3>
            <p className="text-sm text-[#6b6b85] mb-5">Create your first version to start tracking design iterations</p>
            <NewVersionButton deliverableId={d.id} />
          </div>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-220px)]">
          {/* Version sidebar */}
          <div className="w-[200px] flex-shrink-0 border-r border-[#1e1e2e] overflow-y-auto p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3a3a50] mb-3 px-1">Versions</p>
            {d.versions.map((v) => (
              <a
                key={v.id}
                href={`#version-${v.id}`}
                className="block p-3 rounded-xl hover:bg-[#1a1a2e] transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-bold text-[#f0f0f8]">v{v.number}</span>
                  <span className={`badge text-[9px] ${STATUS_COLORS[v.status]}`}>{STATUS_LABELS[v.status]}</span>
                </div>
                {v.assets[0] && (
                  <div className="h-14 rounded-lg overflow-hidden bg-[#1a1a2e] relative mt-1.5">
                    <Image src={v.assets[0].url} alt="" fill className="object-cover opacity-70 group-hover:opacity-100 transition-opacity" sizes="160px" />
                  </div>
                )}
                <p className="text-[10px] text-[#3a3a50] mt-1.5">{formatRelative(v.createdAt)}</p>
              </a>
            ))}
          </div>

          {/* Main content — versions */}
          <div className="flex-1 overflow-y-auto">
            {d.versions.map((version, idx) => (
              <div key={version.id} id={`version-${version.id}`} className="border-b border-[#1e1e2e] last:border-0">
                {/* Version header */}
                <div className="px-8 py-5 flex items-center justify-between sticky top-0 bg-[#0c0c14]/80 backdrop-blur z-10">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-bold text-[#f0f0f8]">v{version.number}</span>
                    <span className={`badge text-[10px] ${STATUS_COLORS[version.status]}`}>{STATUS_LABELS[version.status]}</span>
                    <span className="text-xs text-[#3a3a50]">{formatRelative(version.createdAt)}</span>
                  </div>
                  {version.status !== "APPROVED" && version.status !== "REJECTED" && (
                    <div className="flex items-center gap-2">
                      <VersionActionButton versionId={version.id} action="REJECTED" label="Reject" icon="x" />
                      <VersionActionButton versionId={version.id} action="APPROVED" label="Approve" icon="check" />
                    </div>
                  )}
                </div>

                {/* Notes */}
                {version.notes && (
                  <div className="px-8 mb-4">
                    <p className="text-sm text-[#6b6b85] bg-[#13131f] border border-[#1e1e2e] rounded-xl px-4 py-3">
                      {version.notes}
                    </p>
                  </div>
                )}

                {/* Assets gallery */}
                {version.assets.length > 0 && (
                  <div className="px-8 mb-6">
                    <div className={`grid gap-3 ${version.assets.length === 1 ? "grid-cols-1" : version.assets.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      {version.assets.map((asset) => (
                        <a key={asset.id} href={asset.url} target="_blank" rel="noopener noreferrer">
                          <div className="relative overflow-hidden rounded-2xl bg-[#1a1a2e] group"
                            style={{ aspectRatio: "4/3" }}>
                            <Image
                              src={asset.url}
                              alt={asset.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-xs text-white font-medium truncate">{asset.name}</p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback thread */}
                <div className="px-8 pb-8">
                  <FeedbackThread
                    versionId={version.id}
                    feedback={version.feedback.map((f) => ({
                      ...f,
                      createdAt: f.createdAt.toISOString(),
                      updatedAt: f.updatedAt.toISOString(),
                      replies: f.replies.map((r) => ({
                        ...r,
                        createdAt: r.createdAt.toISOString(),
                      })),
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VersionActionButton({
  versionId,
  action,
  label,
  icon,
}: {
  versionId: string;
  action: string;
  label: string;
  icon: "check" | "x";
}) {
  return (
    <form
      action={async () => {
        "use server";
        const { prisma } = await import("@/lib/prisma");
        await prisma.version.update({ where: { id: versionId }, data: { status: action } });
      }}
    >
      <button
        type="submit"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
          icon === "check"
            ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
        }`}
      >
        {icon === "check" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
        {label}
      </button>
    </form>
  );
}
