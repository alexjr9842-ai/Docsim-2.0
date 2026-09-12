import React, { useState, useEffect } from "react";
import { GitStatus, GitCommit } from "../types";
import {
  GitBranch,
  GitCommit as GitCommitIcon,
  RotateCcw,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Trash2,
  RefreshCw,
  Sparkles
} from "lucide-react";

export const GitManager: React.FC = () => {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [selectedFileForDiff, setSelectedFileForDiff] = useState<string | null>(null);
  const [diffContent, setDiffContent] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchGitData();
  }, []);

  const fetchGitData = async () => {
    try {
      const [statusRes, logRes] = await Promise.all([
        fetch("/api/git/status"),
        fetch("/api/git/log"),
      ]);
      const statusData = await statusRes.json();
      const logData = await logRes.json();
      if (statusData.success) setStatus(statusData);
      if (logData.success) setCommits(logData.commits || []);
    } catch (e) {
      console.error("Error fetching git data:", e);
    }
  };

  const loadDiff = async (filePath: string) => {
    setSelectedFileForDiff(filePath);
    try {
      const res = await fetch(`/api/git/diff?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.success) {
        setDiffContent(data.diff || "(No diff available)");
      }
    } catch (e) {
      console.error("Error fetching diff:", e);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    setIsCommitting(true);
    try {
      const res = await fetch("/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commitMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setCommitMessage("");
        setCommitSuccess(true);
        setTimeout(() => setCommitSuccess(false), 2500);
        setSelectedFileForDiff(null);
        fetchGitData();
      }
    } catch (e) {
      console.error("Error committing:", e);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDiscard = async (filePath?: string) => {
    if (!confirm(`Discard all changes in ${filePath || "the entire repository"}?`)) return;
    try {
      const res = await fetch("/api/git/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedFileForDiff(null);
        fetchGitData();
      }
    } catch (e) {
      console.error("Error discarding changes:", e);
    }
  };

  const handleDownloadZip = () => {
    setIsDownloading(true);
    window.location.href = "/api/export/zip";
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Action Header */}
      <div className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-xs text-slate-200">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>branch: {status?.branch || "master"}</span>
          </div>

          <button
            onClick={fetchGitData}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
            title="Refresh Git Status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-1.5 rounded-md shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? "Preparing ZIP..." : "Download Full Repo (.ZIP)"}</span>
          </button>
        </div>
      </div>

      {/* Main Area: Changes & Commit Form on Left, Diff & Commit History on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Staging & Changes */}
        <div className="w-80 lg:w-96 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Working Tree Status */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 tracking-wider uppercase text-[11px]">
                Working Tree Changes
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  status?.isClean
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {status?.isClean ? "Clean Working Tree" : `${status?.totalChanges} Modified Files`}
              </span>
            </div>

            {/* Changed files list */}
            {status?.totalChanges === 0 ? (
              <div className="py-4 text-center text-slate-500">
                <CheckCircle className="w-6 h-6 text-emerald-500/50 mx-auto mb-1.5" />
                <p>No uncommitted changes in DocSim</p>
              </div>
            ) : (
              <div className="space-y-1 font-mono">
                {status?.modified.map((file) => (
                  <div
                    key={file}
                    onClick={() => loadDiff(file)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                      selectedFileForDiff === file
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="truncate pr-2">{file}</span>
                    <span className="text-[10px] text-amber-400 uppercase shrink-0">[modified]</span>
                  </div>
                ))}

                {status?.untracked.map((file) => (
                  <div
                    key={file}
                    onClick={() => loadDiff(file)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                      selectedFileForDiff === file
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="truncate pr-2">{file}</span>
                    <span className="text-[10px] text-emerald-400 uppercase shrink-0">[untracked]</span>
                  </div>
                ))}
              </div>
            )}

            {!status?.isClean && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleDiscard()}
                  className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Discard All Changes</span>
                </button>
              </div>
            )}
          </div>

          {/* Commit Form */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <span className="font-semibold text-slate-200 tracking-wider uppercase text-[11px] block">
              Create Git Commit
            </span>

            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="e.g. Update Aadhaar template bounding boxes & font configurations"
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 resize-none font-mono"
            />

            <button
              onClick={handleCommit}
              disabled={isCommitting || !commitMessage.trim()}
              className={`w-full py-2 rounded-lg font-medium text-xs shadow flex items-center justify-center gap-1.5 transition ${
                commitMessage.trim()
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isCommitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : commitSuccess ? (
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              ) : (
                <GitCommitIcon className="w-3.5 h-3.5" />
              )}
              <span>{commitSuccess ? "Committed to Git!" : "Commit Changes"}</span>
            </button>
          </div>

          {/* Commit History Timeline */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-400 tracking-wider uppercase text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Commit History
            </span>

            <div className="space-y-2">
              {commits.map((c) => (
                <div key={c.hash} className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-semibold">{c.hash}</span>
                    <span>{c.date}</span>
                  </div>
                  <p className="text-slate-200 mt-1 font-sans text-xs line-clamp-2">{c.subject}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Diff Viewer */}
        <div className="flex-1 flex flex-col bg-slate-950/60 overflow-hidden">
          <div className="h-10 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
            <span className="font-mono text-slate-300">
              {selectedFileForDiff ? `Diff: ${selectedFileForDiff}` : "Select a changed file on the left to inspect Git Diff"}
            </span>

            {selectedFileForDiff && (
              <button
                onClick={() => handleDiscard(selectedFileForDiff)}
                className="inline-flex items-center gap-1 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Revert this file</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
            {selectedFileForDiff ? (
              <pre className="text-emerald-400 whitespace-pre">{diffContent}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <FileText className="w-8 h-8 text-slate-700 mb-2" />
                <p>No file selected for diff comparison</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
