import React from "react";
import { ActiveTab } from "../types";
import {
  Layers,
  Code2,
  FileSpreadsheet,
  Sliders,
  GitBranch,
  Download,
  Github,
  CheckCircle2,
  Sparkles,
  CreditCard
} from "lucide-react";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onDownloadZip: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onDownloadZip,
}) => {
  const tabs = [
    {
      id: "real-card" as ActiveTab,
      label: "Real Card Studio",
      icon: CreditCard,
      badge: "Card & PSD",
    },
    {
      id: "template-designer" as ActiveTab,
      label: "Visual Template Designer",
      icon: Layers,
      badge: "Visual Canvas",
    },
    {
      id: "psd" as ActiveTab,
      label: "PSD Studio",
      icon: Sparkles,
      badge: "Photoshop Layers",
    },
    {
      id: "simulator" as ActiveTab,
      label: "Document Simulator",
      icon: FileSpreadsheet,
      badge: "Synthetic Gen",
    },
    {
      id: "augmentation" as ActiveTab,
      label: "Augmentation Lab",
      icon: Sliders,
      badge: "Shaders",
    },
    {
      id: "editor" as ActiveTab,
      label: "Git Code Editor",
      icon: Code2,
      badge: "All Files",
    },
    {
      id: "git" as ActiveTab,
      label: "Version Control",
      icon: GitBranch,
      badge: "Git Diffs",
    },
  ];

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0 select-none z-30">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white font-sans">
              DocSim Studio
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              AI4Bharat
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate hidden sm:block">
            github.com/AI4Bharat/DocSim
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        <a
          href="https://github.com/AI4Bharat/DocSim"
          target="_blank"
          rel="noreferrer"
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          title="Open AI4Bharat/DocSim on GitHub"
        >
          <Github className="w-4 h-4" />
        </a>

        <button
          onClick={onDownloadZip}
          className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition font-medium"
          title="Download the complete modified repository as a .zip file"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Export ZIP</span>
        </button>
      </div>
    </header>
  );
};
