import { X, Copy, Check, MessageSquare, ShieldAlert, Cpu, Clock, Coins } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import type { QaLog } from "../types";
import { toast } from "sonner";

interface QaDetailsModalProps {
  open: boolean;
  log: QaLog | null;
  onClose: () => void;
}

export default function QaDetailsModal({ open, log, onClose }: QaDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open || !log) return null;

  const handleCopy = async () => {
    try {
      const textToCopy = `[Audit Log ID: ${log.id}]
Timestamp: ${new Date(log.timestamp).toLocaleString()}
User: ${log.userName} (${log.userEmail}) [Role: ${log.userRole}]
Course: ${log.courseCode} - ${log.courseName}
AI Status: ${log.status}
Question: ${log.question}
Answer/Output: ${log.answer || log.errorMessage || "(No response)"}`;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: "Audit log details copied successfully.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const getStatusBadge = () => {
    switch (log.status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50">
            Success
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50">
            Failed
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 animate-pulse">
            Processing
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qa-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border/60 bg-card p-6 shadow-panel motion-safe:animate-fade-up sm:p-8 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              Q&A Audit Trail
            </p>
            <h2 id="qa-modal-title" className="mt-1 text-xl font-bold tracking-tight">
              Dialogue Log Details
            </h2>
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              ID: {log.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* User & Course Metadata Card */}
          <div className="grid gap-4 rounded-xl border border-border/40 bg-muted/10 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                User Details
              </p>
              <p className="mt-1 font-bold text-foreground">{log.userName}</p>
              <p className="text-sm text-muted-foreground">{log.userEmail}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {log.userRole}
                </span>
                {getStatusBadge()}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Subject Context
              </p>
              <p className="mt-1 font-bold text-foreground">
                [{log.courseCode}] {log.courseName}
              </p>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                Time: {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Question Segment */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              Question
            </div>
            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 text-sm text-foreground leading-relaxed">
              {log.question}
            </div>
          </div>

          {/* Answer Segment */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Cpu className="h-4 w-4 text-secondary" />
              AI System Response
            </div>

            {log.status === "SUCCESS" && (
              <div className="rounded-2xl bg-card border border-border/60 p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {log.answer}
              </div>
            )}

            {log.status === "FAILED" && (
              <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive leading-relaxed flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Query Processing Failure</p>
                  <p className="mt-1 font-mono text-xs">{log.errorMessage}</p>
                </div>
              </div>
            )}

            {log.status === "PROCESSING" && (
              <div className="rounded-2xl border border-dashed border-border/60 p-6 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/5 gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs font-medium">Currently streaming or processing RAG context...</p>
              </div>
            )}
          </div>

          {/* Execution Metrics (if completed) */}
          {log.status !== "PROCESSING" && (
            <div className="border-t border-border/40 pt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border/40 p-2.5 bg-muted/5">
                <div className="flex justify-center text-muted-foreground mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Latency
                </p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {log.latencyMs ? `${log.latencyMs} ms` : "N/A"}
                </p>
              </div>
              <div className="rounded-xl border border-border/40 p-2.5 bg-muted/5">
                <div className="flex justify-center text-muted-foreground mb-1">
                  <Coins className="h-4 w-4 text-secondary" />
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Tokens
                </p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {log.tokensUsed !== undefined ? log.tokensUsed : "N/A"}
                </p>
              </div>
              <div className="rounded-xl border border-border/40 p-2.5 bg-muted/5">
                <div className="flex justify-center text-muted-foreground mb-1">
                  <Cpu className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                  RAG Status
                </p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {log.status === "SUCCESS" ? "ONLINE" : "OFFLINE"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/40 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy} className="flex items-center gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Dialogue Text
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
