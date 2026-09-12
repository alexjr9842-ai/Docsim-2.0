import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CardSectionData,
  CardTypeKey,
  CardLayerConfig,
  CARD_PRESETS,
  generateCardQrCodeUrl,
  generateRealisticIdNumber,
  buildCardPsdDocument,
  getOfficialPhotoPlacement,
  getOfficialPresetLayers,
} from "../utils/cardData";
import { CardCanvas } from "./RealCardStudio/CardCanvas";
import { LayersPanel } from "./RealCardStudio/LayersPanel";
import { SuperAdminToolbar } from "./RealCardStudio/SuperAdminToolbar";
import { CardEditorSidebar } from "./RealCardStudio/CardEditorSidebar";
import { SignatureModal } from "./RealCardStudio/SignatureModal";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Layers,
  RotateCw,
  Printer,
  FileCode,
  Download,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

interface RealCardStudioProps {
  initialPsdPath?: string;
  onOpenPsdStudio?: (psdPath: string) => void;
  onOpenTemplateDesigner?: (templatePath: string) => void;
}

export const RealCardStudio: React.FC<RealCardStudioProps> = ({
  initialPsdPath,
  onOpenPsdStudio,
  onOpenTemplateDesigner,
}) => {
  // Preset & Card State
  const [selectedPresetKey, setSelectedPresetKey] = useState<CardTypeKey>("pan-latest");
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [isPhotoshopMode, setIsPhotoshopMode] = useState<boolean>(false);
  const [showGuides, setShowGuides] = useState<boolean>(false);
  const [lockPermanent, setLockPermanent] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(0.85);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const exportCanvasFnRef = useRef<(() => Promise<string>) | null>(null);

  // Initialize Card Data from default preset
  const [cardData, setCardData] = useState<CardSectionData>(() => {
    const preset = CARD_PRESETS.find((p) => p.key === "pan-latest") || CARD_PRESETS[0];
    return {
      id: "card_001",
      presetKey: preset.key,
      cardType: preset.defaultData.cardType || "pan-latest",
      cardTitle: preset.defaultData.cardTitle || "INCOME TAX DEPARTMENT",
      cardTitleHi: preset.defaultData.cardTitleHi || "आयकर विभाग",
      subtitle: preset.defaultData.subtitle || "GOVT. OF INDIA / भारत सरकार",
      emblemType: preset.defaultData.emblemType || "incometax",
      tagline: preset.defaultData.tagline || "Permanent Account Number Card",
      nameEn: preset.defaultData.nameEn || "PRIYA VERMA",
      nameHi: preset.defaultData.nameHi || "प्रिया वर्मा",
      fatherNameEn: preset.defaultData.fatherNameEn || "SURESH VERMA",
      fatherNameHi: preset.defaultData.fatherNameHi || "सुरेश वर्मा",
      dob: preset.defaultData.dob || "22/11/1995",
      gender: preset.defaultData.gender || "FEMALE",
      genderHi: preset.defaultData.genderHi || "महिला",
      bloodGroup: preset.defaultData.bloodGroup || "B+",
      addressEn: "",
      addressHi: "",
      pinCode: "560038",
      studentRollNo: "NIT/2024/CS-8402",
      courseDegree: "B.Tech (Computer Science)",
      department: "School of Computing",
      academicYear: "2024 - 2028",
      designation: "Principal Cloud Architect",
      employeeCode: "EMP-94021",
      emergencyContact: "+1 (555) 234-8901",
      membershipTier: "PLATINUM VIP MEMBER",
      pointsBalance: "248,500 PTS",
      libraryLimit: "5 Books / 30 Days",
      idNumber: preset.defaultData.idNumber || "ABCDE1234F",
      doi: preset.defaultData.doi || "14/03/2020",
      doe: preset.defaultData.doe || "Lifetime",
      isLifetime: true,
      vehicleClasses: "MCWG, LMV",
      photoUrl: preset.defaultData.photoUrl || "/repo-assets/images/people/female_generic.png",
      photoFilter: "none",
      photoBrightness: 1,
      photoContrast: 1,
      hasPassportBorder: true,
      signatureUrl: "",
      signatureColor: "#111827",
      hasGhostPhoto: false,
      hasQrCode: true,
      qrPayload: "",
      hasSmartChip: false,
      hasHologram: true,
      hasBarcode: false,
      hasGuilloche: false,
      finish: preset.defaultData.finish || "glossy",
      lightAngle: 60,
      plasticSheen: 50,
      cardWear: 0,
      backgroundPath: preset.defaultBackground,
      layers: JSON.parse(JSON.stringify(preset.defaultLayers)),
    };
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-Time Dynamic QR Code generation on EVERY input change
  useEffect(() => {
    let isMounted = true;
    generateCardQrCodeUrl(cardData).then((url) => {
      if (isMounted && url) {
        setQrCodeUrl(url);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [
    cardData.idNumber,
    cardData.nameEn,
    cardData.fatherNameEn,
    cardData.dob,
    cardData.gender,
    cardData.cardType,
    cardData.studentRollNo,
    cardData.courseDegree,
    cardData.designation,
    cardData.department,
    cardData.emergencyContact,
    cardData.membershipTier,
    cardData.libraryLimit,
  ]);

  // Handle Preset Switching
  const handleSelectPreset = (key: CardTypeKey) => {
    setSelectedPresetKey(key);
    const preset = CARD_PRESETS.find((p) => p.key === key) || CARD_PRESETS[0];

    setCardData((prev) => ({
      ...prev,
      presetKey: preset.key,
      cardType: preset.key,
      cardTitle: preset.defaultData.cardTitle || prev.cardTitle,
      cardTitleHi: preset.defaultData.cardTitleHi || prev.cardTitleHi,
      subtitle: preset.defaultData.subtitle || prev.subtitle,
      tagline: preset.defaultData.tagline || prev.tagline,
      emblemType: preset.defaultData.emblemType || prev.emblemType,
      nameEn: preset.defaultData.nameEn || prev.nameEn,
      nameHi: preset.defaultData.nameHi || prev.nameHi,
      fatherNameEn: preset.defaultData.fatherNameEn || prev.fatherNameEn,
      fatherNameHi: preset.defaultData.fatherNameHi || prev.fatherNameHi,
      dob: preset.defaultData.dob || prev.dob,
      gender: preset.defaultData.gender || prev.gender,
      bloodGroup: preset.defaultData.bloodGroup || prev.bloodGroup,
      studentRollNo: preset.defaultData.studentRollNo || prev.studentRollNo,
      courseDegree: preset.defaultData.courseDegree || prev.courseDegree,
      department: preset.defaultData.department || prev.department,
      academicYear: preset.defaultData.academicYear || prev.academicYear,
      designation: preset.defaultData.designation || prev.designation,
      employeeCode: preset.defaultData.employeeCode || prev.employeeCode,
      emergencyContact: preset.defaultData.emergencyContact || prev.emergencyContact,
      membershipTier: preset.defaultData.membershipTier || prev.membershipTier,
      pointsBalance: preset.defaultData.pointsBalance || prev.pointsBalance,
      libraryLimit: preset.defaultData.libraryLimit || prev.libraryLimit,
      idNumber: preset.defaultData.idNumber || prev.idNumber,
      doi: preset.defaultData.doi || prev.doi,
      doe: preset.defaultData.doe || prev.doe,
      photoUrl: preset.defaultData.photoUrl || prev.photoUrl,
      backgroundPath: preset.defaultBackground,
      finish: preset.defaultData.finish || "glossy",
      plasticSheen: preset.defaultData.plasticSheen ?? 45,
      layers: JSON.parse(JSON.stringify(preset.defaultLayers)),
    }));

    setActiveLayerId(null);
    showToast(`Loaded template: ${preset.name}`);
  };

  // Reset layers to official standard coordinates
  const handleResetDefaultLayers = () => {
    const officialLayers = getOfficialPresetLayers(selectedPresetKey);
    setCardData((prev) => ({
      ...prev,
      layers: officialLayers.length > 0 ? officialLayers : JSON.parse(JSON.stringify(CARD_PRESETS[0].defaultLayers)),
    }));
    showToast("Reset all layers to official government coordinates");
  };

  // Reset Passport Photo (PP) size & coordinates to official standard
  const handleResetPpSize = () => {
    const officialPhoto = getOfficialPhotoPlacement(cardData.cardType);
    setCardData((prev) => ({
      ...prev,
      photoScale: 1.0,
      photoOffsetX: 0,
      photoOffsetY: 0,
      layers: prev.layers.map((l) =>
        l.id === "photo"
          ? {
              ...l,
              x: officialPhoto.x,
              y: officialPhoto.y,
              width: officialPhoto.width,
              height: officialPhoto.height,
            }
          : l
      ),
    }));
    showToast("Reset passport photo to official standard size & position");
  };

  // Toggle Passport Photo lock
  const handleTogglePpLock = () => {
    setCardData((prev) => {
      const nextLocked = !prev.lockPpPlacement;
      return {
        ...prev,
        lockPpPlacement: nextLocked,
        layers: prev.layers.map((l) =>
          l.id === "photo" ? { ...l, locked: nextLocked } : l
        ),
      };
    });
    showToast(cardData.lockPpPlacement ? "Passport photo unlocked" : "Passport photo position locked");
  };

  // Update a specific layer
  const handleUpdateLayer = (id: string, updates: Partial<CardLayerConfig>) => {
    setCardData((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  // Super Admin: Apply 1-Click Demo Persona
  const handleApplyPersona = (personaData: any, presetKey: CardTypeKey) => {
    if (presetKey !== selectedPresetKey) {
      handleSelectPreset(presetKey);
    }
    setCardData((prev) => ({
      ...prev,
      ...personaData,
    }));
    showToast(`Applied persona: ${personaData.nameEn}`);
  };

  // Super Admin: Generate New Checksum Valid ID Number
  const handleGenerateNewId = () => {
    const newId = generateRealisticIdNumber(cardData.cardType);
    setCardData((prev) => ({ ...prev, idNumber: newId }));
    showToast(`Generated verified ID: ${newId}`);
  };

  // Export 300 DPI Ultra-HD PNG
  const handleExportPng = async () => {
    if (!exportCanvasFnRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await exportCanvasFnRef.current();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${cardData.cardType}_${cardData.idNumber.replace(/\s+/g, "")}_300DPI.png`;
      a.click();
      showToast("Exported 300 DPI print-ready image!");
    } catch (err) {
      console.error("Export error:", err);
      showToast("Export failed, please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export Multi-Layer Photoshop PSD
  const handleExportPsd = () => {
    try {
      const psdBytes = buildCardPsdDocument(cardData);
      const blob = new Blob([psdBytes], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cardData.cardType}_${cardData.idNumber.replace(/\s+/g, "")}.psd`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Exported Adobe Photoshop (.PSD) document!");
    } catch (err) {
      console.error("PSD generation failed:", err);
      showToast("PSD export failed.");
    }
  };

  // Print Card
  const handlePrint = () => {
    window.print();
  };

  // Copy Data as JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(cardData, null, 2));
    showToast("Copied card JSON data to clipboard");
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-blue-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP SUPER ADMIN TOOLBAR */}
      <SuperAdminToolbar
        currentCardType={cardData.cardType}
        cardData={cardData}
        onSelectPreset={handleSelectPreset}
        onApplyPersona={handleApplyPersona}
        onGenerateNewId={handleGenerateNewId}
        lockPermanent={lockPermanent}
        onToggleLockPermanent={() => setLockPermanent(!lockPermanent)}
        showGuides={showGuides}
        onToggleGuides={() => setShowGuides(!showGuides)}
        onExportPng={handleExportPng}
        onExportPsd={handleExportPsd}
        onPrint={handlePrint}
        onCopyJson={handleCopyJson}
        isExporting={isExporting}
      />

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left: Clean, Focused Card Form Sidebar */}
        <CardEditorSidebar
          cardData={cardData}
          onUpdateCardData={(updates) => setCardData((prev) => ({ ...prev, ...updates }))}
          selectedPresetKey={selectedPresetKey}
          onSelectPreset={handleSelectPreset}
          qrCodeUrl={qrCodeUrl}
          isPhotoshopMode={isPhotoshopMode}
          onTogglePhotoshopMode={() => setIsPhotoshopMode(!isPhotoshopMode)}
          onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
          onUpdateLayer={handleUpdateLayer}
          onResetPpSize={handleResetPpSize}
        />

        {/* Center: Stage & High-Fidelity Canvas */}
        <main className="flex-1 flex flex-col items-center justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-auto p-4 relative">
          {/* Top Stage Control Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-md shadow-sm z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-white">
                {CARD_PRESETS.find((p) => p.key === selectedPresetKey)?.name}
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                Standard CR-80 (85.6 × 53.98mm)
              </span>
            </div>

            {/* Mode & Zoom Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  className="p-1 hover:text-white text-slate-400"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-blue-300 w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
                  className="p-1 hover:text-white text-slate-400"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setIsPhotoshopMode(!isPhotoshopMode)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all border ${
                  isPhotoshopMode
                    ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isPhotoshopMode ? "Photoshop Active" : "Photoshop Mode"}</span>
              </button>
            </div>
          </div>

          {/* Central Card Canvas Preview */}
          <div className="flex-1 flex items-center justify-center w-full py-2">
            <CardCanvas
              cardData={cardData}
              activeLayerId={activeLayerId}
              onSelectLayer={setActiveLayerId}
              onUpdateLayer={handleUpdateLayer}
              isPhotoshopMode={isPhotoshopMode}
              showGuides={showGuides}
              lockPermanent={lockPermanent}
              qrCodeUrl={qrCodeUrl}
              zoom={zoom}
              onExportReady={(fn) => {
                exportCanvasFnRef.current = fn;
              }}
            />
          </div>

          {/* Bottom Specifications Status Bar */}
          <div className="w-full max-w-4xl flex flex-wrap items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Permanent Govt Watermarks & Logos Fixed
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline">
                Fonts: <strong className="text-slate-300">Halant-Bold, Arial-Bold, Verdana-Bold, Lemon-Tuesday</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-blue-400">Resolution: 2024 × 1276 (300 DPI)</span>
            </div>
          </div>
        </main>

        {/* Right: Photoshop Mode Layer Inspector Sidebar (Visible when Photoshop mode is enabled) */}
        {isPhotoshopMode && (
          <aside className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-3 flex flex-col h-full overflow-hidden animate-in slide-in-from-right-4 duration-200">
            <LayersPanel
              layers={cardData.layers}
              activeLayerId={activeLayerId}
              onSelectLayer={setActiveLayerId}
              onUpdateLayer={handleUpdateLayer}
              onResetDefaultLayers={handleResetDefaultLayers}
              onResetPpSize={handleResetPpSize}
              isPpLocked={cardData.lockPpPlacement}
              onTogglePpLock={handleTogglePpLock}
            />
          </aside>
        )}
      </div>

      {/* Signature Draw / Customize Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={(dataUrl) => setCardData((prev) => ({ ...prev, signatureUrl: dataUrl }))}
        initialName={cardData.nameEn}
      />
    </div>
  );
};
