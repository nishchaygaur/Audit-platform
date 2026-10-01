"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Upload,
  User,
  Calendar,
  ChevronDown,
  Loader2,
  X,
  Send,
  ShieldCheck,
  Check,
  FileText,
} from "lucide-react";
import {
  getEvidenceRequests,
  createEvidenceRequest,
  reviewEvidenceRequest,
  fulfillEvidenceRequest,
  getEvidenceComments,
  addEvidenceComment,
  type EvidenceRequestRecord,
  type EvidenceCommentRecord,
  type PBCRequestPriority,
  type PBCRequestStatus,
} from "@/actions/evidence-requests";
import { uploadEvidenceFile } from "@/actions/evidence";

interface PBCRequestsViewProps {
  workspaceId: string;
  auditId?: string;
  audits?: Array<{ id: string; name: string }>;
}

export default function PBCRequestsView({
  workspaceId,
  auditId,
  audits = [],
}: PBCRequestsViewProps) {
  const [requests, setRequests] = useState<EvidenceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formAuditId, setFormAuditId] = useState(auditId || (audits[0]?.id ?? ""));
  const [formTitle, setFormTitle] = useState("");
  const [formControl, setFormControl] = useState("A.8.2");
  const [formAssignee, setFormAssignee] = useState("Michael Lee");
  const [formPriority, setFormPriority] = useState<PBCRequestPriority>("High");
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [formDesc, setFormDesc] = useState("");

  // Review Modal / State
  const [reviewingReq, setReviewingReq] = useState<EvidenceRequestRecord | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"Approved" | "Rejected">("Approved");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Upload Fulfill Modal
  const [uploadReq, setUploadReq] = useState<EvidenceRequestRecord | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Comment Drawer State
  const [activeCommentReq, setActiveCommentReq] = useState<EvidenceRequestRecord | null>(null);
  const [comments, setComments] = useState<EvidenceCommentRecord[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await getEvidenceRequests(workspaceId, auditId);
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, auditId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const loadComments = async (requestId: string) => {
    setLoadingComments(true);
    try {
      const res = await getEvidenceComments(workspaceId, { requestId });
      if (res.success && res.data) {
        setComments(res.data);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenComments = (req: EvidenceRequestRecord) => {
    setActiveCommentReq(req);
    loadComments(req.id);
  };

  const handleSendComment = async () => {
    if (!activeCommentReq || !newComment.trim()) return;
    setSendingComment(true);
    try {
      const res = await addEvidenceComment(workspaceId, {
        requestId: activeCommentReq.id,
        message: newComment.trim(),
      });
      if (res.success && res.data) {
        setComments((prev) => [...prev, res.data!]);
        setNewComment("");
        // increment count locally
        setRequests((prev) =>
          prev.map((r) =>
            r.id === activeCommentReq.id
              ? { ...r, comments_count: (Number(r.comments_count) || 0) + 1 }
              : r
          )
        );
      }
    } catch (err) {
      console.error("Failed to send comment:", err);
    } finally {
      setSendingComment(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAssignee.trim()) return;

    setCreating(true);
    try {
      const res = await createEvidenceRequest(workspaceId, {
        auditId: formAuditId || auditId || "AUD-2024-001",
        controlId: formControl,
        title: formTitle,
        assignedTo: formAssignee,
        priority: formPriority,
        dueDate: formDueDate,
        description: formDesc,
      });

      if (res.success) {
        setShowCreateModal(false);
        setFormTitle("");
        setFormDesc("");
        loadRequests();
      }
    } catch (err) {
      console.error("Create request failed:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewingReq) return;
    setSubmittingReview(true);
    try {
      const res = await reviewEvidenceRequest(
        workspaceId,
        reviewingReq.id,
        reviewDecision,
        reviewFeedback
      );
      if (res.success) {
        setReviewingReq(null);
        setReviewFeedback("");
        loadRequests();
      }
    } catch (err) {
      console.error("Review failed:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadReq || !uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("control", uploadReq.control_id);
      formData.append("description", `Submitted in fulfillment of PBC request: ${uploadReq.title}`);
      formData.append("uploadedBy", uploadReq.assigned_to);

      const upRes = await uploadEvidenceFile(workspaceId, uploadReq.audit_id, formData);
      if (upRes.success && upRes.data) {
        await fulfillEvidenceRequest(workspaceId, uploadReq.id, upRes.data.id);
        setUploadReq(null);
        setUploadFile(null);
        loadRequests();
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  // Filtered requests
  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.control_id.toLowerCase().includes(search.toLowerCase()) ||
      r.assigned_to.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || r.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Metrics
  const totalCount = requests.length;
  const requestedCount = requests.filter((r) => r.status === "Requested").length;
  const reviewCount = requests.filter((r) => r.status === "Submitted" || r.status === "Under Review").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;

  const getPriorityBadge = (p: PBCRequestPriority) => {
    switch (p) {
      case "Critical":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "High":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "Medium":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getStatusBadge = (s: PBCRequestStatus) => {
    switch (s) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Under Review":
      case "Submitted":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "Rejected":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[12px] font-medium">Total PBC Requests</span>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{totalCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Formal workpapers requested</div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[12px] font-medium">Awaiting Auditee Upload</span>
            <Clock3 className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{requestedCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Pending client submission</div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[12px] font-medium">In Auditor Review</span>
            <AlertCircle className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{reviewCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Submitted by client</div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[12px] font-medium">Approved & Verified</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{approvedCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Controls verified</div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search request, control, or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[12px] text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Requested">Requested (Pending Upload)</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white shadow-xs hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          New PBC Request
        </button>
      </div>

      {/* Requests Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-[13px] font-medium">No PBC evidence requests found</p>
            <p className="text-[11px] text-slate-400">Create a request to assign evidence collection to team members or auditees.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Request & Control</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Comments</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{req.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          {req.control_id}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-xs">
                          {req.control_title}
                        </span>
                      </div>
                      {req.evidence_name && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
                          <FileText className="h-3 w-3" />
                          <span>Linked: {req.evidence_name}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                          {req.assigned_to[0] || "U"}
                        </div>
                        <span className="text-slate-700 font-medium">{req.assigned_to}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{req.due_date}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadge(
                          req.priority
                        )}`}
                      >
                        {req.priority}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(
                          req.status
                        )}`}
                      >
                        {req.status === "Approved" && <Check className="h-2.5 w-2.5" />}
                        {req.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleOpenComments(req)}
                        className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{Number(req.comments_count) || 0}</span>
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If not approved and not submitted, auditee upload button */}
                        {req.status !== "Approved" && (
                          <button
                            type="button"
                            onClick={() => setUploadReq(req)}
                            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Upload className="h-3 w-3 text-blue-600" />
                            Submit File
                          </button>
                        )}

                        {/* Auditor review button */}
                        <button
                          type="button"
                          onClick={() => setReviewingReq(req)}
                          className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 transition"
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE PBC REQUEST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  New PBC Evidence Request
                </h3>
                <p className="text-[11px] text-slate-400">
                  Assign an evidence deliverable to an auditee or system owner
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Deliverable Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Q3 Penetration Test Executive Summary"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Control Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A.8.2 or CC6.1"
                    value={formControl}
                    onChange={(e) => setFormControl(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Assigned Auditee *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Michael Lee (SecOps)"
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PBCRequestPriority)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Instructions & Criteria for Client
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail exact specifications, acceptable file formats, and required sign-offs..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW DECISION MODAL */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-[15px] font-semibold text-slate-900">
                Auditor Workpaper Review
              </h3>
              <p className="text-[11px] text-slate-400">{reviewingReq.title}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Review Decision
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("Approved")}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-[12px] font-semibold transition ${
                      reviewDecision === "Approved"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Approve Workpaper
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision("Rejected")}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-[12px] font-semibold transition ${
                      reviewDecision === "Rejected"
                        ? "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-rose-600" />
                    Reject (Request Changes)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Reviewer Notes & Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    reviewDecision === "Approved"
                      ? "Control verified; evidentiary support is complete and sufficient."
                      : "Explain why the evidence was rejected and what specific updates are needed..."
                  }
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingReq(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={submittingReview}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium text-white transition ${
                    reviewDecision === "Approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submittingReview && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit {reviewDecision}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD SUBMISSION MODAL */}
      {uploadReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-[15px] font-semibold text-slate-900">
                Submit Evidence for PBC Request
              </h3>
              <p className="text-[11px] text-slate-400">{uploadReq.title}</p>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Select Evidence Document
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-2 block w-full text-[12px] text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Allowed formats: PDF, DOCX, XLSX, CSV, PNG, JPG (max 25 MB)
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadReq(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Upload & Fulfill Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THREADED COMMENTS SLIDE-OVER */}
      {activeCommentReq && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <h3 className="text-[14px] font-semibold text-slate-800">
                    Discussion & Audit Trail
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">
                  {activeCommentReq.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCommentReq(null)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingComments ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-[12px]">
                  No comments yet. Start the conversation between auditor and auditee.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-[12px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{c.user_name}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                            c.user_role === "Auditor"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {c.user_role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{c.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/40">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message or clarification..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleSendComment}
                  disabled={sendingComment || !newComment.trim()}
                  className="flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
