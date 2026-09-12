import React, { useState } from "react";
import {
  CardSectionData,
  CardTypeKey,
  CARD_PRESETS,
  CardPresetConfig,
} from "../../utils/cardData";
import {
  User,
  CreditCard,
  Camera,
  PenTool,
  QrCode,
  ShieldCheck,
  Building,
  GraduationCap,
  Sparkles,
  Sliders,
  Check,
  Lock,
  Unlock,
  Upload,
  Layers,
  RotateCcw,
  ZoomIn,
  Maximize2,
} from "lucide-react";

interface CardEditorSidebarProps {
  cardData: CardSectionData;
  onUpdateCardData: (updates: Partial<CardSectionData>) => void;
  selectedPresetKey: CardTypeKey;
  onSelectPreset: (key: CardTypeKey) => void;
  qrCodeUrl: string;
  isPhotoshopMode: boolean;
  onTogglePhotoshopMode: () => void;
  onOpenSignatureModal: () => void;
  onUpdateLayer?: (id: string, updates: any) => void;
  onResetPpSize?: () => void;
}

export const CardEditorSidebar: React.FC<CardEditorSidebarProps> = ({
  cardData,
  onUpdateCardData,
  selectedPresetKey,
  onSelectPreset,
  qrCodeUrl,
  isPhotoshopMode,
  onTogglePhotoshopMode,
  onOpenSignatureModal,
  onUpdateLayer,
  onResetPpSize,
}) => {
  const [activeTab, setActiveTab] = useState<"fields" | "photo-sig" | "security" | "finishing">("fields");
  const [activeCategory, setActiveCategory] = useState<"All" | "Government & National ID" | "Institutional & Membership Cards">("All");

  const currentPreset = CARD_PRESETS.find((p) => p.key === selectedPresetKey) || CARD_PRESETS[0];

  const filteredPresets = CARD_PRESETS.filter(
    (p) => activeCategory === "All" || p.category === activeCategory
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onUpdateCardData({ photoUrl: ev.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onUpdateCardData({ signatureUrl: ev.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside className="w-full lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden text-slate-200 shadow-lg">
      {/* Top Preset Switcher & Category Filter */}
      <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            Select Card Template
          </label>
          <span className="text-[10px] bg-slate-800 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
            {currentPreset.badge}
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setActiveCategory("All")}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              activeCategory === "All" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            All Cards
          </button>
          <button
            onClick={() => setActiveCategory("Government & National ID")}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              activeCategory === "Government & National ID"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Govt IDs
          </button>
          <button
            onClick={() => setActiveCategory("Institutional & Membership Cards")}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              activeCategory === "Institutional & Membership Cards"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Institutions
          </button>
        </div>

        {/* Preset Cards Carousel / Grid */}
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {filteredPresets.map((preset) => (
            <button
              key={preset.key}
              onClick={() => onSelectPreset(preset.key)}
              className={`text-left p-2 rounded-lg border transition-all text-xs flex flex-col justify-between ${
                selectedPresetKey === preset.key
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-sm"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <span className="font-semibold truncate text-[11px]">{preset.name}</span>
              <span className="text-[10px] text-slate-500">{preset.badge}</span>
            </button>
          ))}
        </div>

        {/* Permanent Elements Guarantee Banner */}
        <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-emerald-200">Authentic Permanent Background</div>
            <p className="text-[10px] text-emerald-400/90 leading-tight">
              {currentPreset.permanentDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-medium">
        <button
          onClick={() => setActiveTab("fields")}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === "fields"
              ? "border-blue-500 text-blue-400 bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Card Fields</span>
        </button>

        <button
          onClick={() => setActiveTab("photo-sig")}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === "photo-sig"
              ? "border-blue-500 text-blue-400 bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Photo & Sig</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === "security"
              ? "border-blue-500 text-blue-400 bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Live QR</span>
        </button>

        <button
          onClick={() => setActiveTab("finishing")}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === "finishing"
              ? "border-blue-500 text-blue-400 bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Finish</span>
        </button>
      </div>

      {/* Editor Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: CARD FIELDS (Only necessary fields for the current card!) */}
        {activeTab === "fields" && (
          <div className="space-y-3.5">
            {/* 1. Main ID / Serial Number */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>
                  {cardData.cardType.includes("pan")
                    ? "PAN Card Number"
                    : cardData.cardType.includes("aadhaar")
                    ? "12-Digit Aadhaar Number"
                    : cardData.cardType.includes("driving")
                    ? "Driving License No (DL)"
                    : cardData.cardType.includes("voter")
                    ? "EPIC Serial Number"
                    : cardData.cardType === "student-card"
                    ? "Student ID Number"
                    : cardData.cardType === "employee-card"
                    ? "Employee ID Code"
                    : cardData.cardType === "loyalty-card"
                    ? "16-Digit VIP Card Number"
                    : "Library Card Number"}
                </span>
                <span className="text-emerald-400 font-mono text-[9px]">Official Format</span>
              </label>
              <input
                type="text"
                value={cardData.idNumber}
                onChange={(e) => onUpdateCardData({ idNumber: e.target.value })}
                placeholder="Enter ID number"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 2. Holder Name (English & Hindi) */}
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Cardholder Full Name (English)
                </label>
                <input
                  type="text"
                  value={cardData.nameEn}
                  onChange={(e) => onUpdateCardData({ nameEn: e.target.value })}
                  placeholder="e.g. PRIYA VERMA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Show Hindi name field for Govt cards that support dual-script */}
              {(cardData.cardType.includes("aadhaar") ||
                cardData.cardType.includes("pan") ||
                cardData.cardType.includes("voter") ||
                cardData.cardType.includes("driving")) && (
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                    Cardholder Name (Hindi / Devanagari)
                  </label>
                  <input
                    type="text"
                    value={cardData.nameHi}
                    onChange={(e) => onUpdateCardData({ nameHi: e.target.value })}
                    placeholder="e.g. प्रिया वर्मा"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500 font-serif"
                  />
                </div>
              )}
            </div>

            {/* 3. Father's Name / Relative Name (for PAN, Aadhaar, Voter, DL) */}
            {(cardData.cardType.includes("pan") ||
              cardData.cardType.includes("driving") ||
              cardData.cardType.includes("voter") ||
              cardData.cardType.includes("aadhaar")) && (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  {cardData.cardType.includes("driving")
                    ? "Son/Daughter/Wife of"
                    : cardData.cardType.includes("voter")
                    ? "Father / Husband Name"
                    : "Father's Full Name"}
                </label>
                <input
                  type="text"
                  value={cardData.fatherNameEn}
                  onChange={(e) => onUpdateCardData({ fatherNameEn: e.target.value })}
                  placeholder="e.g. SURESH VERMA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs uppercase focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* 4. DOB & Gender */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Date of Birth
                </label>
                <input
                  type="text"
                  value={cardData.dob}
                  onChange={(e) => onUpdateCardData({ dob: e.target.value })}
                  placeholder="DD/MM/YYYY"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Gender
                </label>
                <select
                  value={cardData.gender}
                  onChange={(e) => onUpdateCardData({ gender: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="MALE">MALE / पुरुष</option>
                  <option value="FEMALE">FEMALE / महिला</option>
                  <option value="TRANSGENDER">OTHER / अन्य</option>
                </select>
              </div>
            </div>

            {/* 5. Driving License Specifics */}
            {cardData.cardType === "driving-license" && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Driving License Credentials
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Date of Issue</label>
                    <input
                      type="text"
                      value={cardData.doi}
                      onChange={(e) => onUpdateCardData({ doi: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Validity (NT)</label>
                    <input
                      type="text"
                      value={cardData.doe}
                      onChange={(e) => onUpdateCardData({ doe: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Blood Group</label>
                    <input
                      type="text"
                      value={cardData.bloodGroup}
                      onChange={(e) => onUpdateCardData({ bloodGroup: e.target.value })}
                      placeholder="B+"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">COV (Classes)</label>
                    <input
                      type="text"
                      value={cardData.vehicleClasses}
                      onChange={(e) => onUpdateCardData({ vehicleClasses: e.target.value })}
                      placeholder="MCWG, LMV"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. Student Card Specifics */}
            {cardData.cardType === "student-card" && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  Academic Credentials
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">University / Institute</label>
                  <input
                    type="text"
                    value={cardData.cardTitle}
                    onChange={(e) => onUpdateCardData({ cardTitle: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Roll Number</label>
                    <input
                      type="text"
                      value={cardData.studentRollNo}
                      onChange={(e) => onUpdateCardData({ studentRollNo: e.target.value })}
                      placeholder="NIT/2024/CS-8402"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Academic Session</label>
                    <input
                      type="text"
                      value={cardData.academicYear}
                      onChange={(e) => onUpdateCardData({ academicYear: e.target.value })}
                      placeholder="2024 - 2028"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Course / Degree</label>
                  <input
                    type="text"
                    value={cardData.courseDegree}
                    onChange={(e) => onUpdateCardData({ courseDegree: e.target.value })}
                    placeholder="B.Tech (Computer Science)"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            )}

            {/* 7. Corporate Employee Specifics */}
            {cardData.cardType === "employee-card" && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Corporate Staff Details
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Company Name</label>
                  <input
                    type="text"
                    value={cardData.cardTitle}
                    onChange={(e) => onUpdateCardData({ cardTitle: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Job Designation</label>
                    <input
                      type="text"
                      value={cardData.designation}
                      onChange={(e) => onUpdateCardData({ designation: e.target.value })}
                      placeholder="Principal Cloud Architect"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Department</label>
                    <input
                      type="text"
                      value={cardData.department}
                      onChange={(e) => onUpdateCardData({ department: e.target.value })}
                      placeholder="Engineering"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Employee Code</label>
                    <input
                      type="text"
                      value={cardData.employeeCode}
                      onChange={(e) => onUpdateCardData({ employeeCode: e.target.value })}
                      placeholder="EMP-94021"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Emergency Contact</label>
                    <input
                      type="text"
                      value={cardData.emergencyContact}
                      onChange={(e) => onUpdateCardData({ emergencyContact: e.target.value })}
                      placeholder="+1 (555) 0192"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 8. Loyalty Card Specifics */}
            {cardData.cardType === "loyalty-card" && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  VIP Membership Tier
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Tier Name</label>
                    <input
                      type="text"
                      value={cardData.membershipTier}
                      onChange={(e) => onUpdateCardData({ membershipTier: e.target.value })}
                      placeholder="PLATINUM VIP MEMBER"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Valid Thru (Expiry)</label>
                    <input
                      type="text"
                      value={cardData.doe}
                      onChange={(e) => onUpdateCardData({ doe: e.target.value })}
                      placeholder="12/29"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 9. Library Card Specifics */}
            {cardData.cardType === "library-card" && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Library Borrowing Rules
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Checkout Limit Policy</label>
                  <input
                    type="text"
                    value={cardData.libraryLimit}
                    onChange={(e) => onUpdateCardData({ libraryLimit: e.target.value })}
                    placeholder="5 Books / 30 Days Circulation"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PHOTO & SIGNATURE */}
        {activeTab === "photo-sig" && (
          <div className="space-y-4">
            {/* Cardholder Portrait & PP Size Studio */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  Passport Photo (PP Size) Studio
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 font-medium">
                    Selfie Auto-Fit Active
                  </span>
                </div>
              </div>

              {/* Photo Preview & Upload */}
              <div className="flex items-center gap-3">
                <div
                  className="w-20 h-24 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden shadow-inner flex items-center justify-center shrink-0 relative"
                  style={{
                    backgroundColor:
                      cardData.photoBackdrop === "studio-blue"
                        ? "#93c5fd"
                        : cardData.photoBackdrop === "studio-grey"
                        ? "#e2e8f0"
                        : cardData.photoBackdrop === "studio-white"
                        ? "#ffffff"
                        : "#0f172a",
                  }}
                >
                  {cardData.photoUrl ? (
                    <img
                      src={cardData.photoUrl}
                      alt="Portrait"
                      className="w-full h-full object-cover transition-transform duration-150"
                      style={{
                        transform: `scale(${cardData.photoScale || 1.0}) translate(${cardData.photoOffsetX || 0}%, ${cardData.photoOffsetY || 0}%)`,
                        filter:
                          cardData.photoFilter === "grayscale"
                            ? "grayscale(100%)"
                            : cardData.photoFilter === "govt-id"
                            ? "contrast(115%) saturate(92%)"
                            : cardData.photoFilter === "high-contrast"
                            ? "contrast(135%)"
                            : "none",
                      }}
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-600" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Any Selfie / Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Upload any selfie — auto-crops and fits exactly to official passport frame.
                  </p>

                  <div className="grid grid-cols-2 gap-1 pt-0.5">
                    <button
                      onClick={() =>
                        onUpdateCardData({
                          photoUrl: "/repo-assets/images/people/female_generic.png",
                        })
                      }
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition-colors"
                    >
                      Sample Female
                    </button>
                    <button
                      onClick={() =>
                        onUpdateCardData({
                          photoUrl: "/repo-assets/images/people/male_generic.jpg",
                        })
                      }
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition-colors"
                    >
                      Sample Male
                    </button>
                  </div>
                </div>
              </div>

              {/* PP Size (Width & Height) Sliders & Position Controls */}
              {(() => {
                const photoLayer = (cardData.layers || []).find((l) => l.id === "photo");
                const currentW = photoLayer?.width ?? 20;
                const currentH = photoLayer?.height ?? 38;

                return (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-emerald-400" />
                        Passport Photo (PP) Size
                      </span>
                      <div className="flex items-center gap-1">
                        {onResetPpSize && (
                          <button
                            onClick={onResetPpSize}
                            className="text-[10px] px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded flex items-center gap-1 transition-colors"
                            title="Reset PP Size and Placement to Official Govt Template Standards"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reset Official</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const nextLock = !cardData.lockPpPlacement;
                            onUpdateCardData({ lockPpPlacement: nextLock });
                            if (onUpdateLayer) {
                              onUpdateLayer("photo", { locked: nextLock });
                            }
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${
                            cardData.lockPpPlacement
                              ? "bg-amber-600/20 border-amber-500/40 text-amber-300"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                          title="Lock PP size and placement to prevent accidental moving"
                        >
                          {cardData.lockPpPlacement ? (
                            <Lock className="w-2.5 h-2.5" />
                          ) : (
                            <Unlock className="w-2.5 h-2.5" />
                          )}
                          <span>{cardData.lockPpPlacement ? "Locked" : "Lock PP"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>PP Width</span>
                          <span className="font-mono text-emerald-300">{currentW.toFixed(1)}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="45"
                          step="0.5"
                          value={currentW}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (onUpdateLayer) onUpdateLayer("photo", { width: val });
                          }}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>PP Height</span>
                          <span className="font-mono text-emerald-300">{currentH.toFixed(1)}%</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="60"
                          step="0.5"
                          value={currentH}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (onUpdateLayer) onUpdateLayer("photo", { height: val });
                          }}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Face Zoom & Pan Calibration (Framing) */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <ZoomIn className="w-3 h-3 text-cyan-400" />
                    Selfie Framing (Zoom & Pan)
                  </span>
                  <button
                    onClick={() =>
                      onUpdateCardData({
                        photoScale: 1.0,
                        photoOffsetX: 0,
                        photoOffsetY: 0,
                      })
                    }
                    className="text-[10px] text-slate-400 hover:text-white transition-colors"
                  >
                    Center Face
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Face Zoom (Scale)</span>
                      <span className="font-mono text-cyan-300">
                        {Math.round((cardData.photoScale || 1.0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="2.2"
                      step="0.05"
                      value={cardData.photoScale || 1.0}
                      onChange={(e) =>
                        onUpdateCardData({ photoScale: parseFloat(e.target.value) })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Pan X (Horiz)</span>
                        <span className="font-mono text-slate-300">
                          {cardData.photoOffsetX || 0}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        step="1"
                        value={cardData.photoOffsetX || 0}
                        onChange={(e) =>
                          onUpdateCardData({ photoOffsetX: parseInt(e.target.value) })
                        }
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Pan Y (Vert)</span>
                        <span className="font-mono text-slate-300">
                          {cardData.photoOffsetY || 0}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        step="1"
                        value={cardData.photoOffsetY || 0}
                        onChange={(e) =>
                          onUpdateCardData({ photoOffsetY: parseInt(e.target.value) })
                        }
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Studio Backdrop & Tone Matrix */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  Studio Backdrop Auto-Fill
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "studio-white", label: "Studio White (PAN)" },
                    { id: "studio-blue", label: "Govt Blue (DL / ID)" },
                    { id: "studio-grey", label: "Studio Neutral Grey" },
                    { id: "none", label: "Original Selfie BG" },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => onUpdateCardData({ photoBackdrop: bg.id as any })}
                      className={`px-2 py-1.5 text-[10px] rounded-lg border font-medium text-left transition-all ${
                        cardData.photoBackdrop === bg.id
                          ? "bg-blue-600/30 border-blue-500 text-blue-200"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ID Print Tone Matrix */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  Polycarbonate ID Print Tone
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: "govt-id", label: "Govt Print" },
                    { id: "grayscale", label: "Grayscale" },
                    { id: "none", label: "Standard" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => onUpdateCardData({ photoFilter: filter.id as any })}
                      className={`px-2 py-1 text-[10px] rounded border font-medium text-center transition-all ${
                        (cardData.photoFilter || "govt-id") === filter.id
                          ? "bg-emerald-600/30 border-emerald-500 text-emerald-200"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Official Signature */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                  Cardholder Signature
                </label>
                <span className="text-[10px] text-cyan-400 font-medium">True Lemon-Tuesday Font</span>
              </div>

              {/* Signature Preview Canvas / Box */}
              <div className="p-3 bg-white rounded-lg border border-slate-300 h-16 flex items-center justify-center shadow-inner overflow-hidden">
                {cardData.signatureUrl ? (
                  <img
                    src={cardData.signatureUrl}
                    alt="Signature"
                    className="max-h-full object-contain"
                  />
                ) : (
                  <span
                    className="text-2xl text-blue-900"
                    style={{ fontFamily: "'Lemon-Tuesday', cursive" }}
                  >
                    {cardData.nameEn || "Authorized Sign"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onOpenSignatureModal}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                >
                  <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Draw / Customize</span>
                </button>

                <label className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload PNG</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Ink Color Selector */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-[10px] text-slate-400">Signature Ink Color</span>
                <div className="flex items-center gap-1.5">
                  {["#1e40af", "#0f172a", "#0284c7"].map((col) => (
                    <button
                      key={col}
                      onClick={() => onUpdateCardData({ signatureColor: col })}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        cardData.signatureColor === col
                          ? "border-white scale-110 shadow"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE QR CODE INSPECTOR */}
        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-purple-400" />
                  Dynamic Auto-Generated QR Code
                </label>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  Live Sync ⚡
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 block" />
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 animate-pulse rounded" />
                  )}
                </div>

                <div className="space-y-1 text-[11px] text-slate-400">
                  <p className="font-semibold text-white">Instant Keystroke Encoding</p>
                  <p className="text-[10px] leading-relaxed">
                    Updates in real time as you edit Name, ID number, DOB, or other details.
                    Scannable by all smartphones.
                  </p>
                </div>
              </div>

              {/* Payload Preview */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Embedded Verification Payload:
                </span>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 break-all max-h-24 overflow-y-auto">
                  {cardData.cardType.includes("pan")
                    ? `PAN:${cardData.idNumber}|NAME:${cardData.nameEn}|FATHER:${cardData.fatherNameEn}|DOB:${cardData.dob}`
                    : cardData.cardType.includes("aadhaar")
                    ? `<PrintLetterBarcodeData uid="${cardData.idNumber}" name="${cardData.nameEn}" dob="${cardData.dob}"/>`
                    : `ID:${cardData.idNumber}|HOLDER:${cardData.nameEn}|AUTH:${cardData.cardTitle}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PHYSICAL FINISH & PVC TEXTURE */}
        {activeTab === "finishing" && (
          <div className="space-y-3.5">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                Physical Card Surface
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateCardData({ finish: "glossy" })}
                  className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                    cardData.finish === "glossy"
                      ? "bg-blue-600/20 border-blue-500 text-white shadow"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Glossy PVC Sheen
                </button>
                <button
                  onClick={() => onUpdateCardData({ finish: "matte" })}
                  className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                    cardData.finish === "matte"
                      ? "bg-blue-600/20 border-blue-500 text-white shadow"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Matte Synthetic Finish
                </button>
              </div>

              {cardData.finish === "glossy" && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Plastic Reflection Intensity</span>
                    <span className="font-mono text-blue-300">{cardData.plasticSheen}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cardData.plasticSheen}
                    onChange={(e) =>
                      onUpdateCardData({ plasticSheen: parseInt(e.target.value) || 0 })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Photoshop Pro Mode Bottom Switcher Banner */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-xs font-bold text-white">Photoshop Pro Mode</div>
            <div className="text-[10px] text-slate-400">Interactive Canvas Drag & Layers</div>
          </div>
        </div>

        <button
          onClick={onTogglePhotoshopMode}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isPhotoshopMode
              ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/20"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
          }`}
        >
          {isPhotoshopMode ? "Active 🎨" : "Enable"}
        </button>
      </div>
    </aside>
  );
};
