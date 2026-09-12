import React, { useState } from "react";
import {
  CardTypeKey,
  CARD_PRESETS,
  SUPER_ADMIN_PERSONAS,
  generateRealisticIdNumber,
  CardSectionData,
} from "../../utils/cardData";
import {
  ShieldAlert,
  Sparkles,
  Lock,
  Unlock,
  Grid,
  Download,
  Printer,
  Copy,
  Check,
  FileCode,
  Users,
  ChevronDown,
  RefreshCw,
  Eye,
} from "lucide-react";

interface SuperAdminToolbarProps {
  currentCardType: CardTypeKey;
  cardData: CardSectionData;
  onSelectPreset: (key: CardTypeKey) => void;
  onApplyPersona: (personaData: any, presetKey: CardTypeKey) => void;
  onGenerateNewId: () => void;
  lockPermanent: boolean;
  onToggleLockPermanent: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  onExportPng: () => void;
  onExportPsd: () => void;
  onPrint: () => void;
  onCopyJson: () => void;
  isExporting: boolean;
}

export const SuperAdminToolbar: React.FC<SuperAdminToolbarProps> = ({
  currentCardType,
  cardData,
  onSelectPreset,
  onApplyPersona,
  onGenerateNewId,
  lockPermanent,
  onToggleLockPermanent,
  showGuides,
  onToggleGuides,
  onExportPng,
  onExportPsd,
  onPrint,
  onCopyJson,
  isExporting,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyJson();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-md">
      {/* Brand & Super Admin Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                ID Craft Studio
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Government & Institutional Verified Specification Engine
            </p>
          </div>
        </div>
      </div>

      {/* Center: 1-Click Profile Personas & Card Quick Switcher */}
      <div className="flex items-center gap-2">
        {/* Personas Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 font-medium transition-colors shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Load Demo Persona</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showPersonaMenu && (
            <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 divide-y divide-slate-800">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Instant 1-Click Test Profiles
              </div>
              <div className="max-h-72 overflow-y-auto p-1 space-y-0.5">
                {SUPER_ADMIN_PERSONAS.map((persona, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onApplyPersona(persona.data, persona.presetKey);
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-600/20 hover:text-blue-200 flex items-center justify-between text-xs text-slate-300 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">{persona.name}</div>
                      <div className="text-[10px] text-slate-400">{persona.role}</div>
                    </div>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                      Load
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Generate Valid ID Button */}
        <button
          onClick={onGenerateNewId}
          title="Generate Realistic Checksum Valid ID"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-lg border border-slate-700 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>New Serial ID</span>
        </button>

        {/* Safe Guides Toggle */}
        <button
          onClick={onToggleGuides}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
            showGuides
              ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
          }`}
          title="Toggle 3mm Bleed Margins & Alignment Crosshairs"
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Guides</span>
        </button>

        {/* Lock Permanent Government Emblems Toggle */}
        <button
          onClick={onToggleLockPermanent}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
            lockPermanent
              ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
          }`}
          title="Lock official government logos, emblems & watermarks from overprinting"
        >
          {lockPermanent ? (
            <>
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Govt Lock ON</span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Govt Lock OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Right: Export & Output Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
          title="Copy Card Data as JSON"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">JSON</span>
        </button>

        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
          title="Print Card at 100% Physical CR-80 Scale"
        >
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Print</span>
        </button>

        <button
          onClick={onExportPsd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs rounded-lg border border-blue-500/30 transition-colors font-medium shadow-sm"
          title="Export Multi-Layer Adobe Photoshop PSD"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>PSD</span>
        </button>

        <button
          onClick={onExportPng}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? "Rendering..." : "Export 300 DPI"}</span>
        </button>
      </div>
    </header>
  );
};
