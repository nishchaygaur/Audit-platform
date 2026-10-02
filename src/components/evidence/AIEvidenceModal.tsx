"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  X,
  Loader2,
  Check,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { AIEvidenceAnalysis } from "@/lib/gemini";
import { analyzeEvidenceWithAI, updateEvidence } from "@/actions/evidence";

interface AIEvidenceModalProps {
  isOpen?: boolean;
  onClose: () => void;
  workspaceId: string;
  evidence: {
    id: string;
    reference: string;
    name: string;
    control: string;
    framework: string;
    status: string;
    ai_status?: string;
    ai_confidence?: number;
    ai_analysis?: string;
  };
  onSuccess?: () => void;
}

export default function AIEvidenceModal({
  isOpen = true,
  onClose,
  workspaceId,
  evidence,
  onSuccess,
}: AIEvidenceModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [localAnalysis, setLocalAnalysis] = useState<AIEvidenceAnalysis | null>(() => {
    if (evidence.ai_analysis) {
      try {
        return JSON.parse(evidence.ai_analysis);
      } catch {
        return null;
      }
    }
    return null;
  });

  if (!isOpen) return null;

  const handleRunScan = async () => {
    setAnalyzing(true);
    try {
      const res = await analyzeEvidenceWithAI(workspaceId, evidence.id);
      if (res.success && res.data) {
        setLocalAnalysis(res.data);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("AI pre-scan failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptEvidence = async () => {
    setAccepting(true);
    try {
      await updateEvidence(workspaceId, evidence.id, {
        status: "Accepted",
        reviewedBy: "AI Auditor & Lead QA",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to accept evidence:", err);
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectEvidence = async () => {
    setRejecting(true);
    try {
      await updateEvidence(workspaceId, evidence.id, {
        status: "Rejected",
        reviewedBy: "AI Auditor (Flagged Non-Evidence)",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to reject evidence:", err);
    } finally {
      setRejecting(false);
    }
  };

  const analysis = localAnalysis;
  const isNonEvidence = analysis && (analysis.isEvidence === false || analysis.status === "Invalid Evidence");

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Compliant":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "Partially Compliant":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "Deficient":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "Invalid Evidence":
        return "bg-rose-600/15 text-rose-600 dark:text-rose-400 border-rose-500/40";
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                  Gemini AI Evidence Pre-Scan
                </h3>
                <span className="rounded-md bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Automated evaluation against {evidence.control} ({evidence.framework})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Artifact Summary Card */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4">
            <div className="grid grid-cols-2 gap-4 text-[12px] sm:grid-cols-4">
              <div>
                <span className="text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500">Artifact</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={evidence.name}>
                  {evidence.name}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500">Reference</span>
                <p className="font-medium text-slate-700 dark:text-slate-300">{evidence.reference}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500">Control</span>
                <p className="font-semibold text-blue-600 dark:text-blue-400">{evidence.control}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500">Current Status</span>
                <p className="font-medium text-slate-700 dark:text-slate-300">{evidence.status}</p>
              </div>
            </div>
          </div>

          {!analysis && !analyzing && (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-[14px] font-semibold text-slate-800 dark:text-slate-100">
                No Pre-Scan Conducted Yet
              </h4>
              <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Execute an AI inspection of this workpaper to verify whether it meets the control objectives of {evidence.control} under {evidence.framework}.
              </p>
              <button
                type="button"
                onClick={handleRunScan}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-[12px] font-medium text-white shadow-sm hover:from-purple-700 hover:to-indigo-700 transition"
              >
                <Sparkles className="h-4 w-4" />
                Run AI Pre-Scan Now
              </button>
            </div>
          )}

          {analyzing && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50/50 dark:bg-slate-800/40">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
              <h4 className="mt-4 text-[14px] font-semibold text-slate-800 dark:text-slate-100">
                Gemini 3.8 Flash is Analyzing Evidence...
              </h4>
              <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                Validating evidentiary relevance, content authenticity, and checking compliance control alignment.
              </p>
            </div>
          )}

          {analysis && !analyzing && (
            <div className="space-y-4">
              {/* Invalid Evidence Rejection Warning Banner */}
              {isNonEvidence && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-rose-100 dark:bg-rose-900/60 p-2 text-rose-600 dark:text-rose-400 shrink-0">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[13px] font-semibold text-rose-900 dark:text-rose-200">
                          Non-Audit Artifact Detected
                        </h4>
                        {analysis.evidenceTypeIdentified && (
                          <span className="rounded-md bg-rose-200/60 dark:bg-rose-900/80 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:text-rose-300">
                            Identified As: {analysis.evidenceTypeIdentified}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-rose-700 dark:text-rose-300 leading-relaxed">
                        {analysis.rejectionReason ||
                          "This file does not appear to be legitimate corporate IT, security, or compliance audit evidence (e.g., photo, invoice, personal media, or dummy file). It cannot be used to satisfy compliance controls."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Score and Status Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-5 shadow-xs">
                <div className="flex items-center gap-4">
                  <div
                    className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 ${
                      isNonEvidence
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60"
                        : "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60"
                    }`}
                  >
                    <span
                      className={`text-[18px] font-bold ${
                        isNonEvidence
                          ? "text-rose-700 dark:text-rose-400"
                          : "text-purple-700 dark:text-purple-300"
                      }`}
                    >
                      {analysis.confidenceScore}%
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusColor(
                          analysis.status
                        )}`}
                      >
                        {analysis.status}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {analysis.suggestedRating}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunScan}
                  className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Re-evaluate
                </button>
              </div>

              {/* Strengths */}
              {analysis.strengths && analysis.strengths.length > 0 && (
                <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20 p-4">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Key Evidentiary Strengths
                  </div>
                  <ul className="mt-2.5 space-y-1.5 pl-6 text-[12px] text-slate-700 dark:text-slate-300 list-disc">
                    {analysis.strengths.map((str, idx) => (
                      <li key={idx} className="leading-snug">{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps */}
              {analysis.gaps && analysis.gaps.length > 0 && (
                <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Identified Compliance Gaps
                  </div>
                  <ul className="mt-2.5 space-y-1.5 pl-6 text-[12px] text-slate-700 dark:text-slate-300 list-disc">
                    {analysis.gaps.map((gap, idx) => (
                      <li key={idx} className="leading-snug">{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/30 dark:bg-indigo-950/20 p-4">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-indigo-800 dark:text-indigo-300">
                    <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Auditor Next Steps & Guidance
                  </div>
                  <ul className="mt-2.5 space-y-1.5 pl-6 text-[12px] text-slate-700 dark:text-slate-300 list-disc">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="leading-snug">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right">
                Model: {analysis.model} • Evaluated at {new Date(analysis.scannedAt).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>

          {analysis && (
            <div className="flex items-center gap-2">
              {isNonEvidence ? (
                <>
                  <button
                    type="button"
                    onClick={handleAcceptEvidence}
                    disabled={accepting || rejecting}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    {accepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Override & Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectEvidence}
                    disabled={rejecting || accepting}
                    className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-rose-700 transition disabled:opacity-50 shadow-sm"
                  >
                    {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    Reject Evidence (AI Recommended)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRejectEvidence}
                    disabled={rejecting || accepting}
                    className="rounded-lg border border-rose-200 dark:border-rose-900/60 px-3.5 py-2 text-[12px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition disabled:opacity-50"
                  >
                    {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reject Evidence"}
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptEvidence}
                    disabled={accepting || rejecting}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
                  >
                    {accepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Accept Evidence (AI Recommended)
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
