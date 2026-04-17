"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelative, getInitials } from "@/lib/utils";
import { MessageSquare, CheckCircle, Circle, ChevronDown, ChevronUp, Send } from "lucide-react";

interface Reply {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface FeedbackItem {
  id: string;
  content: string;
  author: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
}

interface Props {
  versionId: string;
  feedback: FeedbackItem[];
}

function FeedbackCard({ item, onResolve, onReply }: {
  item: FeedbackItem;
  onResolve: (id: string, resolved: boolean) => void;
  onReply: (id: string, content: string) => void;
}) {
  const [showReplies, setShowReplies] = useState(!item.resolved);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);

  async function submitReply() {
    if (!replyText.trim()) return;
    await onReply(item.id, replyText);
    setReplyText("");
    setShowReplyInput(false);
  }

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      item.resolved
        ? "border-[#1e1e2e] opacity-60"
        : "border-[#2a2a40] bg-[#13131f]"
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-violet-700/30 border border-violet-700/20 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
            {getInitials(item.author)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#f0f0f8]">{item.author}</span>
              <span className="text-[10px] text-[#3a3a50]">{formatRelative(item.createdAt)}</span>
            </div>
            <p className="text-sm text-[#a0a0b8] leading-relaxed">{item.content}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pl-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onResolve(item.id, !item.resolved)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                item.resolved
                  ? "text-emerald-400 hover:text-emerald-300"
                  : "text-[#3a3a50] hover:text-emerald-400"
              }`}
            >
              {item.resolved ? <CheckCircle size={12} /> : <Circle size={12} />}
              {item.resolved ? "Resolved" : "Mark resolved"}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-xs text-[#3a3a50] hover:text-[#6b6b85] transition-colors"
            >
              Reply
            </button>
          </div>

          {item.replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-[#3a3a50] hover:text-[#6b6b85]"
            >
              {item.replies.length} {item.replies.length === 1 ? "reply" : "replies"}
              {showReplies ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && item.replies.length > 0 && (
        <div className="border-t border-[#1e1e2e] bg-[#0c0c14]">
          {item.replies.map((reply) => (
            <div key={reply.id} className="px-4 py-3 flex items-start gap-3 border-b border-[#1e1e2e] last:border-0">
              <div className="w-6 h-6 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[10px] font-bold text-[#6b6b85] flex-shrink-0">
                {getInitials(reply.author)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-[#f0f0f8]">{reply.author}</span>
                  <span className="text-[10px] text-[#3a3a50]">{formatRelative(reply.createdAt)}</span>
                </div>
                <p className="text-xs text-[#a0a0b8] leading-relaxed">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReplyInput && (
        <div className="border-t border-[#1e1e2e] p-4 bg-[#0c0c14] flex items-center gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitReply()}
            className="input flex-1 text-xs py-1.5"
            placeholder="Write a reply…"
            autoFocus
          />
          <button
            onClick={submitReply}
            disabled={!replyText.trim()}
            className="text-violet-400 hover:text-violet-300 disabled:text-[#3a3a50] transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export function FeedbackThread({ versionId, feedback: initialFeedback }: Props) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function addComment() {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, content: newComment, author: "Alex Rivera" }),
      });
      if (res.ok) {
        const created = await res.json();
        setFeedback([...feedback, { ...created, createdAt: created.createdAt, updatedAt: created.updatedAt, replies: [] }]);
        setNewComment("");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resolveComment(id: string, resolved: boolean) {
    const res = await fetch(`/api/feedback/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved }),
    });
    if (res.ok) {
      setFeedback(feedback.map((f) => (f.id === id ? { ...f, resolved } : f)));
    }
  }

  async function addReply(feedbackId: string, content: string) {
    const res = await fetch(`/api/feedback/${feedbackId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, author: "Alex Rivera" }),
    });
    if (res.ok) {
      const reply = await res.json();
      setFeedback(
        feedback.map((f) =>
          f.id === feedbackId
            ? { ...f, replies: [...f.replies, { ...reply, createdAt: reply.createdAt }] }
            : f
        )
      );
    }
  }

  const open = feedback.filter((f) => !f.resolved);
  const resolved = feedback.filter((f) => f.resolved);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={14} className="text-[#6b6b85]" />
        <span className="text-xs font-semibold text-[#6b6b85]">Feedback</span>
        {open.length > 0 && (
          <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full">
            {open.length} open
          </span>
        )}
      </div>

      {/* New comment */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          AR
        </div>
        <div className="flex-1 flex items-center gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addComment()}
            className="input flex-1 text-sm"
            placeholder="Add a comment on this version…"
          />
          <button
            onClick={addComment}
            disabled={!newComment.trim() || submitting}
            className="text-violet-400 hover:text-violet-300 disabled:text-[#3a3a50] transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Open feedback */}
      {open.length > 0 && (
        <div className="space-y-3 mb-4">
          {open.map((item) => (
            <FeedbackCard key={item.id} item={item} onResolve={resolveComment} onReply={addReply} />
          ))}
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <details className="group">
          <summary className="text-xs text-[#3a3a50] hover:text-[#6b6b85] cursor-pointer list-none flex items-center gap-1.5 mb-3">
            <ChevronDown size={11} className="group-open:rotate-180 transition-transform" />
            {resolved.length} resolved
          </summary>
          <div className="space-y-2">
            {resolved.map((item) => (
              <FeedbackCard key={item.id} item={item} onResolve={resolveComment} onReply={addReply} />
            ))}
          </div>
        </details>
      )}

      {feedback.length === 0 && (
        <p className="text-xs text-[#3a3a50] text-center py-4">No comments yet — be the first to leave feedback</p>
      )}
    </div>
  );
}
