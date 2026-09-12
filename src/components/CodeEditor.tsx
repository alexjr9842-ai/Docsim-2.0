import React, { useState, useEffect } from "react";
import { FileNode } from "../types";
import {
  FileCode,
  Folder,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Save,
  Trash2,
  Edit2,
  FilePlus,
  FolderPlus,
  Search,
  Check,
  RotateCcw,
  GitCompare,
  Type,
  Code2,
  FileJson,
  X,
  RefreshCw,
  Sparkles,
  Download
} from "lucide-react";

interface CodeEditorProps {
  initialFile?: string;
  onFileSaved?: (path: string) => void;
  onOpenPsd?: (path: string) => void;
}

interface OpenTab {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isBinary?: boolean;
  base64?: string;
  mimeType?: string;
  isDirty?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ initialFile, onFileSaved, onOpenPsd }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(
    new Set(["docsim", "templates", "documentation", "fonts", "images"])
  );
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [gitDiffText, setGitDiffText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // New file/folder modals
  const [showNewModal, setShowNewModal] = useState<{ type: "file" | "folder"; parentPath: string } | null>(null);
  const [newItemName, setNewItemName] = useState("");

  useEffect(() => {
    fetchFileTree();
    if (initialFile) {
      openFile(initialFile);
    } else {
      openFile("README.md");
    }
  }, []);

  const fetchFileTree = async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.success && data.tree) {
        setFileTree(data.tree);
      }
    } catch (e) {
      console.error("Error fetching file tree:", e);
    }
  };

  const openFile = async (filePath: string) => {
    // Check if already open
    const existing = openTabs.find((t) => t.path === filePath);
    if (existing) {
      setActiveTabPath(filePath);
      return;
    }

    setIsLoadingFile(true);
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.success) {
        const fileName = filePath.split("/").pop() || filePath;
        const newTab: OpenTab = {
          path: filePath,
          name: fileName,
          content: data.content || "",
          originalContent: data.content || "",
          isBinary: data.isBinary,
          base64: data.base64,
          mimeType: data.mimeType,
          isDirty: false,
        };
        setOpenTabs((prev) => [...prev, newTab]);
        setActiveTabPath(filePath);
        setShowDiff(false);
      }
    } catch (e) {
      console.error("Error opening file:", e);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter((t) => t.path !== path);
    setOpenTabs(nextTabs);
    if (activeTabPath === path) {
      setActiveTabPath(nextTabs.length > 0 ? nextTabs[nextTabs.length - 1].path : null);
    }
  };

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  const handleContentChange = (newContent: string) => {
    if (!activeTabPath) return;
    setOpenTabs((prev) =>
      prev.map((t) => {
        if (t.path === activeTabPath) {
          return {
            ...t,
            content: newContent,
            isDirty: newContent !== t.originalContent,
          };
        }
        return t;
      })
    );
  };

  const handleSave = async () => {
    if (!activeTab || activeTab.isBinary) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: activeTab.path, content: activeTab.content }),
      });
      const data = await res.json();
      if (data.success) {
        setOpenTabs((prev) =>
          prev.map((t) => (t.path === activeTab.path ? { ...t, originalContent: t.content, isDirty: false } : t))
        );
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        if (onFileSaved) onFileSaved(activeTab.path);
      }
    } catch (e) {
      console.error("Error saving file:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut Ctrl/Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // Load Git Diff for current file
  const loadDiff = async () => {
    if (!activeTabPath) return;
    try {
      const res = await fetch(`/api/git/diff?path=${encodeURIComponent(activeTabPath)}`);
      const data = await res.json();
      if (data.success) {
        setGitDiffText(data.diff || "(No uncommitted changes in this file)");
        setShowDiff(true);
      }
    } catch (e) {
      console.error("Error fetching diff:", e);
    }
  };

  // Create file/folder
  const handleCreateItem = async () => {
    if (!showNewModal || !newItemName.trim()) return;
    const fullPath = showNewModal.parentPath ? `${showNewModal.parentPath}/${newItemName.trim()}` : newItemName.trim();
    try {
      const res = await fetch("/api/file/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: fullPath, isDirectory: showNewModal.type === "folder" }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewModal(null);
        setNewItemName("");
        fetchFileTree();
        if (showNewModal.type === "file") openFile(fullPath);
      }
    } catch (e) {
      console.error("Error creating item:", e);
    }
  };

  // Delete file
  const handleDeleteItem = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${path}?`)) return;
    try {
      const res = await fetch("/api/file/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (data.success) {
        closeTab(path, e);
        fetchFileTree();
      }
    } catch (e) {
      console.error("Error deleting file:", e);
    }
  };

  const toggleDir = (dirPath: string) => {
    const next = new Set(expandedDirs);
    if (next.has(dirPath)) next.delete(dirPath);
    else next.add(dirPath);
    setExpandedDirs(next);
  };

  // Recursive Tree Item Renderer
  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes
      .filter((node) => {
        if (!searchQuery) return true;
        return node.path.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .map((node) => {
        const isDir = node.type === "directory";
        const isExpanded = expandedDirs.has(node.path);
        const isActive = activeTabPath === node.path;
        const ext = node.extension || "";

        let Icon = FileText;
        let iconColor = "text-slate-400";
        if (ext === ".py") {
          Icon = Code2;
          iconColor = "text-amber-400";
        } else if (ext === ".json") {
          Icon = FileJson;
          iconColor = "text-emerald-400";
        } else if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
          Icon = ImageIcon;
          iconColor = "text-purple-400";
        } else if (ext === ".ttf" || ext === ".otf") {
          Icon = Type;
          iconColor = "text-sky-400";
        } else if (ext === ".md") {
          Icon = FileCode;
          iconColor = "text-blue-400";
        }

        return (
          <div key={node.path}>
            <div
              onClick={() => (isDir ? toggleDir(node.path) : openFile(node.path))}
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
              className={`group flex items-center justify-between py-1 px-2 text-xs cursor-pointer select-none transition-colors ${
                isActive ? "bg-emerald-500/20 text-emerald-300 font-medium" : "text-slate-300 hover:bg-slate-800/70"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {isDir ? (
                  isExpanded ? (
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
                )}
                <span className="truncate">{node.name}</span>
              </div>

              {/* Hover actions */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 pr-1">
                {isDir && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNewModal({ type: "file", parentPath: node.path });
                    }}
                    className="p-0.5 hover:text-emerald-400 text-slate-500"
                    title="New file in this folder"
                  >
                    <FilePlus className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDeleteItem(node.path, e)}
                  className="p-0.5 hover:text-red-400 text-slate-500"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {isDir && isExpanded && node.children && renderTree(node.children, depth + 1)}
          </div>
        );
      });
  };

  return (
    <div className="flex h-full bg-slate-900 text-slate-100 overflow-hidden select-none">
      {/* Left Sidebar: Repository Tree */}
      <div className="w-64 lg:w-72 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
        {/* Repo Header */}
        <div className="h-12 px-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 tracking-wider uppercase font-mono">DocSim Repository</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewModal({ type: "file", parentPath: "" })}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
              title="New File at root"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowNewModal({ type: "folder", parentPath: "" })}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
              title="New Folder at root"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fetchFileTree}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
              title="Refresh tree"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-2 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter repository files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-md pl-8 pr-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Tree container */}
        <div className="flex-1 overflow-y-auto py-2 divide-y-0 divide-slate-800/50 font-mono">
          {renderTree(fileTree)}
        </div>
      </div>

      {/* Center: File Tab Bar & Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden">
        {/* Tab Bar */}
        <div className="h-10 bg-slate-950 border-b border-slate-800 flex items-center px-2 gap-1 overflow-x-auto shrink-0">
          {openTabs.map((tab) => {
            const isActive = tab.path === activeTabPath;
            return (
              <div
                key={tab.path}
                onClick={() => {
                  setActiveTabPath(tab.path);
                  setShowDiff(false);
                }}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs font-mono cursor-pointer border-t-2 transition-colors ${
                  isActive
                    ? "bg-slate-900 border-emerald-500 text-white font-medium"
                    : "border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                }`}
              >
                <span>{tab.name}</span>
                {tab.isDirty && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
                <button
                  onClick={(e) => closeTab(tab.path, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Subheader Toolbar */}
        {activeTab && (
          <div className="h-9 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px] truncate max-w-md text-slate-300">
              docsim_repo/{activeTab.path}
            </span>

            <div className="flex items-center gap-2">
              {!activeTab.isBinary && (
                <>
                  <button
                    onClick={() => (showDiff ? setShowDiff(false) : loadDiff())}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition ${
                      showDiff ? "bg-blue-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    <GitCompare className="w-3 h-3" />
                    <span>{showDiff ? "Back to Editor" : "Git Diff"}</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving || !activeTab.isDirty}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded font-medium text-xs shadow transition ${
                      activeTab.isDirty
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {isSaving ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : saveSuccess ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    <span>{saveSuccess ? "Saved!" : "Save File"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Editor or Viewer Body */}
        <div className="flex-1 overflow-hidden relative">
          {isLoadingFile ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !activeTab ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-6">
              <FileCode className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-sm font-medium text-slate-400">No file opened</p>
              <p className="text-xs text-slate-600 mt-1">Select any file from the repository tree on the left.</p>
            </div>
          ) : showDiff ? (
            /* Diff View */
            <div className="h-full overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed">
              <div className="pb-2 mb-3 border-b border-slate-800 text-slate-400 font-semibold flex items-center justify-between">
                <span>Working File vs. Git HEAD</span>
              </div>
              <pre className="whitespace-pre font-mono text-emerald-400">{gitDiffText}</pre>
            </div>
          ) : activeTab.isBinary ? (
            /* Binary Asset Viewer (PSD, Font, or Image) */
            <div className="h-full overflow-auto p-8 flex flex-col items-center justify-center bg-slate-950">
              {activeTab.path.endsWith(".psd") ? (
                /* Photoshop Document Preview & Quick Opener */
                <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-sky-950/50">
                    <span className="font-extrabold text-white text-xl tracking-tighter font-sans">
                      Ps
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white font-mono">{activeTab.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{activeTab.path}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      Adobe Photoshop Document with editable text layers, vector coordinates, and assets.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                    {onOpenPsd && (
                      <button
                        onClick={() => onOpenPsd(activeTab.path)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg transition"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Open in PSD Studio</span>
                      </button>
                    )}

                    <a
                      href={`data:image/vnd.adobe.photoshop;base64,${activeTab.base64}`}
                      download={activeTab.name}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl transition text-xs font-medium"
                    >
                      <Download className="w-4 h-4 text-sky-400" />
                      <span>Download .PSD</span>
                    </a>
                  </div>
                </div>
              ) : activeTab.path.endsWith(".ttf") || activeTab.path.endsWith(".otf") ? (
                /* Font Preview */
                <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
                    <Type className="w-5 h-5 text-sky-400" />
                    <div>
                      <h4 className="font-semibold text-sm">{activeTab.name}</h4>
                      <p className="text-xs text-slate-400">TrueType / OpenType Font Glyph Catalog</p>
                    </div>
                  </div>
                  <div className="py-6 space-y-4">
                    <div className="text-2xl tracking-wide font-normal">
                      The quick brown fox jumps over the lazy dog.
                    </div>
                    <div className="text-2xl tracking-wide font-normal text-emerald-400">
                      भारत सरकार • இந்திய அரசு • GOVERNMENT OF INDIA
                    </div>
                    <div className="text-lg text-slate-400 font-mono">
                      0123456789 !@#$%^&*()_+=-
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 pt-4 border-t border-slate-800 font-mono">
                    Directly loaded from docsim_repo/fonts/
                  </div>
                </div>
              ) : (
                /* Image Preview */
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={`data:${activeTab.mimeType};base64,${activeTab.base64}`}
                    alt={activeTab.name}
                    className="max-h-[60vh] max-w-full rounded-lg shadow-2xl border border-slate-800 object-contain"
                  />
                  <span className="font-mono text-xs text-slate-400">{activeTab.name}</span>
                </div>
              )}
            </div>
          ) : (
            /* Text & Code Editor */
            <div className="h-full flex overflow-hidden">
              <textarea
                value={activeTab.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full bg-slate-900 text-slate-100 font-mono text-xs p-4 leading-relaxed outline-none resize-none selection:bg-emerald-500/30 font-normal"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* New File / Folder Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl text-xs">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Create New {showNewModal.type === "file" ? "File" : "Folder"}
            </h3>
            <p className="text-slate-400 mb-4">
              Inside: <span className="font-mono text-emerald-400">{showNewModal.parentPath || "root"}</span>
            </p>
            <input
              type="text"
              placeholder={`e.g. ${showNewModal.type === "file" ? "new_template.json" : "custom_models"}`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewModal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateItem}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
