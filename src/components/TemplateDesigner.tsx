import React, { useState, useEffect, useRef } from "react";
import {
  DocSimTemplate,
  ComponentDef,
  getComponentEntries
} from "../types";
import {
  Save,
  Plus,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Eye,
  Type,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  Code,
  Layers,
  ChevronRight,
  Move,
  CreditCard
} from "lucide-react";

interface TemplateDesignerProps {
  initialPath?: string;
  onSaved?: (path: string) => void;
  onOpenPsdStudio?: () => void;
  onOpenRealCardStudio?: () => void;
}

const PRESET_TEMPLATES = [
  { name: "Aadhaar Front (Tamil)", path: "templates/Aadhaar/Front/template.json" },
  { name: "PAN Latest", path: "templates/PAN/Latest/template.json" },
  { name: "PAN New", path: "templates/PAN/New/template.json" },
  { name: "PAN Old", path: "templates/PAN/Old/template.json" },
  { name: "Voter Card HI (Front)", path: "templates/VoterCard-HI/Front/template.json" },
  { name: "Voter Card HI (Back)", path: "templates/VoterCard-HI/Back/template.json" },
  { name: "Voter Card TA (Front)", path: "templates/VoterCard-Ta/Front/template.json" },
  { name: "Voter Card TA (Back)", path: "templates/VoterCard-Ta/Back/template.json" },
  { name: "Driving License (Smart-Front)", path: "templates/Driving-License/Smart-Front/template.json" },
];

const AVAILABLE_FONTS = [
  { label: "Arial Regular", path: "fonts/Arial_Regular.ttf" },
  { label: "Arial Bold", path: "fonts/Arial_Bold.ttf" },
  { label: "Verdana Bold", path: "fonts/Verdana_Bold.ttf" },
  { label: "Halant Bold (Hindi)", path: "fonts/Halant-Bold.ttf" },
  { label: "Mukta Malar Medium (Tamil)", path: "fonts/MuktaMalar-Medium.ttf" },
  { label: "Tamil Unicode Elango Kalyani", path: "fonts/Tamil_Unicode_Elango_Kalyani.ttf" },
  { label: "Lemon Tuesday (Signature)", path: "fonts/Lemon_Tuesday.otf" },
];

export const TemplateDesigner: React.FC<TemplateDesignerProps> = ({
  initialPath,
  onSaved,
  onOpenPsdStudio,
  onOpenRealCardStudio,
}) => {
  const [selectedTemplatePath, setSelectedTemplatePath] = useState(
    initialPath || "templates/Aadhaar/Front/template.json"
  );
  const [templateData, setTemplateData] = useState<DocSimTemplate | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [rawJsonError, setRawJsonError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isPrintedField, setIsPrintedField] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // View settings
  const [viewMode, setViewMode] = useState<"visual" | "split" | "json">("visual");
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [bgDimensions, setBgDimensions] = useState({ width: 1000, height: 600 });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, fieldX: 0, fieldY: 0 });
  const [isDrawingNew, setIsDrawingNew] = useState(false);
  const [drawBox, setDrawBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);

  // Load template from server
  useEffect(() => {
    loadTemplate(selectedTemplatePath);
  }, [selectedTemplatePath]);

  const loadTemplate = async (path: string) => {
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.success && data.content) {
        const parsed = JSON.parse(data.content);
        setTemplateData(parsed);
        setJsonText(data.content);
        setRawJsonError(null);
        setIsDirty(false);
        // Select first component if any
        const firstKey = Object.keys(parsed.components || {})[0];
        if (firstKey) {
          setSelectedKey(firstKey);
          setIsPrintedField(false);
        }
      }
    } catch (err: any) {
      console.error("Failed to load template", err);
    }
  };

  // Keep JSON string in sync when templateData changes
  const updateTemplate = (newTemplate: DocSimTemplate) => {
    setTemplateData(newTemplate);
    setJsonText(JSON.stringify(newTemplate, null, 4));
    setIsDirty(true);
    setRawJsonError(null);
  };

  // Save template to server
  const handleSave = async () => {
    if (!templateData) return;
    setIsSaving(true);
    try {
      const contentToSave = viewMode === "json" ? jsonText : JSON.stringify(templateData, null, 4);
      const res = await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedTemplatePath, content: contentToSave }),
      });
      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2500);
        if (onSaved) onSaved(selectedTemplatePath);
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
  }, [templateData, jsonText, viewMode, selectedTemplatePath]);

  // Handle JSON manual editing
  const handleJsonChange = (text: string) => {
    setJsonText(text);
    setIsDirty(true);
    try {
      const parsed = JSON.parse(text);
      setTemplateData(parsed);
      setRawJsonError(null);
    } catch (e: any) {
      setRawJsonError(e.message);
    }
  };

  // Component getter / setter
  const getSelectedComponent = (): ComponentDef | null => {
    if (!templateData || !selectedKey) return null;
    if (isPrintedField) {
      return templateData.printed_fields?.[selectedKey] || null;
    }
    return templateData.components?.[selectedKey] || null;
  };

  const updateSelectedComponent = (updates: Partial<ComponentDef>) => {
    if (!templateData || !selectedKey) return;
    const newTemplate = { ...templateData };
    if (isPrintedField) {
      if (!newTemplate.printed_fields) newTemplate.printed_fields = {};
      newTemplate.printed_fields[selectedKey] = {
        ...newTemplate.printed_fields[selectedKey],
        ...updates,
      };
    } else {
      if (!newTemplate.components) newTemplate.components = {};
      newTemplate.components[selectedKey] = {
        ...newTemplate.components[selectedKey],
        ...updates,
      };
    }
    updateTemplate(newTemplate);
  };

  const handleRenameKey = (newKey: string) => {
    if (!templateData || !selectedKey || !newKey || newKey === selectedKey) return;
    const newTemplate = { ...templateData };
    if (isPrintedField) {
      const current = newTemplate.printed_fields?.[selectedKey];
      if (current && newTemplate.printed_fields) {
        delete newTemplate.printed_fields[selectedKey];
        newTemplate.printed_fields[newKey] = current;
      }
    } else {
      const current = newTemplate.components?.[selectedKey];
      if (current && newTemplate.components) {
        delete newTemplate.components[selectedKey];
        newTemplate.components[newKey] = current;
      }
    }
    setSelectedKey(newKey);
    updateTemplate(newTemplate);
  };

  const handleDeleteSelected = () => {
    if (!templateData || !selectedKey) return;
    const newTemplate = { ...templateData };
    if (isPrintedField && newTemplate.printed_fields) {
      delete newTemplate.printed_fields[selectedKey];
    } else if (newTemplate.components) {
      delete newTemplate.components[selectedKey];
    }
    setSelectedKey(null);
    updateTemplate(newTemplate);
  };

  const handleDuplicateSelected = () => {
    if (!templateData || !selectedKey) return;
    const current = getSelectedComponent();
    if (!current) return;
    const dupKey = `${selectedKey}_copy`;
    const newComp: ComponentDef = {
      ...JSON.parse(JSON.stringify(current)),
      location: {
        x_left: (current.location.x_left || 0) + 20,
        y_top: (current.location.y_top || 0) + 20,
      },
    };
    const newTemplate = { ...templateData };
    if (isPrintedField) {
      if (!newTemplate.printed_fields) newTemplate.printed_fields = {};
      newTemplate.printed_fields[dupKey] = newComp;
    } else {
      if (!newTemplate.components) newTemplate.components = {};
      newTemplate.components[dupKey] = newComp;
    }
    setSelectedKey(dupKey);
    updateTemplate(newTemplate);
  };

  const handleAddNewComponent = (type: "text" | "image") => {
    if (!templateData) return;
    let baseName = type === "image" ? "new_photo" : "new_field";
    let counter = 1;
    while (templateData.components?.[`${baseName}_${counter}`]) counter++;
    const key = `${baseName}_${counter}`;

    const newComp: ComponentDef = {
      type,
      filler_mode: type === "image" ? "random" : "fixed",
      filler_text: type === "text" ? "Sample Value" : undefined,
      entity: type === "image" ? "photo" : "text",
      location: {
        x_left: Math.round(bgDimensions.width * 0.3),
        y_top: Math.round(bgDimensions.height * 0.4),
      },
      dims: type === "image" ? { width: 180, height: 220 } : { width: 250, height: 40 },
      font_size: templateData.defaults?.font_size || 32,
      font_color: templateData.defaults?.font_color || "rgb(0,0,0)",
    };

    const newTemplate = {
      ...templateData,
      components: {
        ...templateData.components,
        [key]: newComp,
      },
    };
    setSelectedKey(key);
    setIsPrintedField(false);
    updateTemplate(newTemplate);
  };

  // Canvas Mouse Dragging for moving boxes
  const handleMouseDownOnField = (e: React.MouseEvent, key: string, isPrinted: boolean) => {
    e.stopPropagation();
    setSelectedKey(key);
    setIsPrintedField(isPrinted);
    const comp = isPrinted ? templateData?.printed_fields?.[key] : templateData?.components?.[key];
    if (!comp) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      fieldX: comp.location.x_left,
      fieldY: comp.location.y_top,
    });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isDragging && selectedKey && templateData) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      const newX = Math.max(0, Math.round(dragStart.fieldX + dx));
      const newY = Math.max(0, Math.round(dragStart.fieldY + dy));
      updateSelectedComponent({
        location: { x_left: newX, y_top: newY },
      });
    }

    if (isDrawingNew && drawBox) {
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (rect) {
        const currentX = (e.clientX - rect.left) / zoom;
        const currentY = (e.clientY - rect.top) / zoom;
        setDrawBox({ ...drawBox, currentX, currentY });
      }
    }
  };

  const handleMouseUpCanvas = () => {
    setIsDragging(false);
    if (isDrawingNew && drawBox) {
      const x = Math.min(drawBox.startX, drawBox.currentX);
      const y = Math.min(drawBox.startY, drawBox.currentY);
      const w = Math.abs(drawBox.currentX - drawBox.startX);
      const h = Math.abs(drawBox.currentY - drawBox.startY);

      if (w > 20 && h > 10) {
        // Create drawn box
        const key = `field_${Date.now().toString().slice(-4)}`;
        const newComp: ComponentDef = {
          type: "text",
          filler_mode: "fixed",
          filler_text: "New Text",
          location: { x_left: Math.round(x), y_top: Math.round(y) },
          dims: { width: Math.round(w), height: Math.round(h) },
          font_size: Math.round(h * 0.7),
        };
        const newTemplate = {
          ...templateData!,
          components: { ...templateData!.components, [key]: newComp },
        };
        setSelectedKey(key);
        setIsPrintedField(false);
        updateTemplate(newTemplate);
      }
      setIsDrawingNew(false);
      setDrawBox(null);
    }
  };

  // Nudge coordinate helpers
  const nudge = (dx: number, dy: number) => {
    const comp = getSelectedComponent();
    if (!comp) return;
    updateSelectedComponent({
      location: {
        x_left: Math.max(0, (comp.location.x_left || 0) + dx),
        y_top: Math.max(0, (comp.location.y_top || 0) + dy),
      },
    });
  };

  const nudgeDim = (dw: number, dh: number) => {
    const comp = getSelectedComponent();
    if (!comp) return;
    const curW = comp.dims?.width || 200;
    const curH = comp.dims?.height || 40;
    updateSelectedComponent({
      dims: {
        width: Math.max(10, curW + dw),
        height: Math.max(10, curH + dh),
      },
    });
  };

  const selectedComp = getSelectedComponent();
  const bgImgUrl = templateData?.background_img ? `/repo-assets/${templateData.background_img}` : "";

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Template:</label>
          <select
            value={selectedTemplatePath}
            onChange={(e) => setSelectedTemplatePath(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 text-sm rounded-md px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none font-medium"
          >
            {PRESET_TEMPLATES.map((tmpl) => (
              <option key={tmpl.path} value={tmpl.path}>
                {tmpl.name}
              </option>
            ))}
          </select>

          {isDirty && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Unsaved changes
            </span>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setViewMode("visual")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === "visual" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Visual Canvas
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === "split" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setViewMode("json")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === "json" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Raw JSON
          </button>
        </div>

        {/* Tools & Save Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddNewComponent("text")}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition"
            title="Add dynamic text component"
          >
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Text Field</span>
          </button>
          <button
            onClick={() => handleAddNewComponent("image")}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition"
            title="Add photo or QR box"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>+ Photo/QR</span>
          </button>

          {onOpenRealCardStudio && (
            <button
              onClick={onOpenRealCardStudio}
              className="inline-flex items-center gap-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-md transition"
              title="Open in Real Card Studio"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real Card Studio</span>
            </button>
          )}

          {onOpenPsdStudio && (
            <button
              onClick={onOpenPsdStudio}
              className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition"
              title="Open Photoshop PSD Template Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>PSD Studio</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium px-4 py-1.5 rounded-md shadow transition"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveToast ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveToast ? "Saved to Git!" : "Save Template"}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Canvas + Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Center Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/60 overflow-hidden relative">
          {/* Canvas Controls Floating Bar */}
          <div className="h-10 border-b border-slate-800/80 px-4 flex items-center justify-between bg-slate-900/60 text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <span className="text-slate-400 font-mono text-[11px]">
                {templateData?.doc_name || "DocSim"} | {bgDimensions.width}x{bgDimensions.height}px
              </span>
              <div className="h-3 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-1 rounded hover:bg-slate-800 transition ${showGrid ? "text-emerald-400 bg-slate-800" : "text-slate-400"}`}
                  title="Toggle Coordinate Grid"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={`p-1 rounded hover:bg-slate-800 transition ${showLabels ? "text-emerald-400 bg-slate-800" : "text-slate-400"}`}
                  title="Toggle Field Label Tags"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 font-mono">
              <button
                onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center text-[11px]">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2.5, zoom + 0.1))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="text-[11px] px-2 py-0.5 hover:bg-slate-800 rounded text-slate-300 border border-slate-700 ml-1"
                title="Reset to 100%"
              >
                100%
              </button>
            </div>
          </div>

          {/* Canvas Scrollable Viewport */}
          <div
            className="flex-1 overflow-auto p-8 flex items-center justify-center relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={handleMouseUpCanvas}
            onClick={() => setSelectedKey(null)}
          >
            {templateData && (
              <div
                ref={canvasContainerRef}
                style={{
                  width: bgDimensions.width * zoom,
                  height: bgDimensions.height * zoom,
                  transformOrigin: "center center",
                }}
                className="relative bg-slate-800 shadow-2xl border border-slate-700/80 select-none transition-[width,height] duration-75"
              >
                {/* Background Image */}
                <img
                  ref={bgImageRef}
                  src={bgImgUrl}
                  alt="Template Background"
                  className="w-full h-full object-contain pointer-events-none"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) {
                      setBgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                    }
                  }}
                />

                {/* Grid Overlay */}
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                      backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
                      backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
                    }}
                  />
                )}

                {/* Interactive Bounding Boxes: Printed Fields (Fixed) */}
                {getComponentEntries(templateData.printed_fields).map(([key, field]) => {
                  const x = (field.location?.x_left || 0) * zoom;
                  const y = (field.location?.y_top || 0) * zoom;
                  const w = (field.dims?.width || 120) * zoom;
                  const h = (field.dims?.height || 36) * zoom;
                  const isSelected = selectedKey === key && isPrintedField;

                  return (
                    <div
                      key={`printed_${key}`}
                      onMouseDown={(e) => handleMouseDownOnField(e, key, true)}
                      style={{
                        left: x,
                        top: y,
                        width: w,
                        height: h,
                      }}
                      className={`absolute cursor-move border transition-colors flex items-center px-1 overflow-hidden ${
                        isSelected
                          ? "border-sky-400 bg-sky-500/20 ring-2 ring-sky-400/50 z-20"
                          : "border-sky-500/60 bg-sky-900/10 hover:border-sky-400 hover:bg-sky-500/15 z-10"
                      }`}
                    >
                      {showLabels && (
                        <span className="absolute -top-4 left-0 text-[10px] font-mono bg-sky-950/90 text-sky-300 px-1 rounded border border-sky-600/40 pointer-events-none truncate max-w-full">
                          [fixed] {key}
                        </span>
                      )}
                      <span className="text-[11px] text-sky-200/90 font-mono truncate select-none">
                        {field.text || key}
                      </span>
                    </div>
                  );
                })}

                {/* Interactive Bounding Boxes: Dynamic Components */}
                {getComponentEntries(templateData.components).map(([key, comp]) => {
                  const x = (comp.location?.x_left || 0) * zoom;
                  const y = (comp.location?.y_top || 0) * zoom;
                  const w = (comp.dims?.width || (comp.type === "image" ? 180 : 200)) * zoom;
                  const h = (comp.dims?.height || (comp.type === "image" ? 220 : 38)) * zoom;
                  const isSelected = selectedKey === key && !isPrintedField;
                  const isImage = comp.type === "image";

                  return (
                    <div
                      key={`comp_${key}`}
                      onMouseDown={(e) => handleMouseDownOnField(e, key, false)}
                      style={{
                        left: x,
                        top: y,
                        width: w,
                        height: h,
                      }}
                      className={`absolute cursor-move border transition-colors flex items-center justify-between px-1.5 overflow-hidden ${
                        isSelected
                          ? isImage
                            ? "border-purple-400 bg-purple-500/25 ring-2 ring-purple-400/50 z-30"
                            : "border-emerald-400 bg-emerald-500/25 ring-2 ring-emerald-400/50 z-30"
                          : isImage
                          ? "border-purple-500/70 bg-purple-950/20 hover:border-purple-400 z-10"
                          : "border-emerald-500/70 bg-emerald-950/20 hover:border-emerald-400 z-10"
                      }`}
                    >
                      {showLabels && (
                        <span
                          className={`absolute -top-4 left-0 text-[10px] font-mono px-1 rounded border pointer-events-none truncate max-w-full z-40 ${
                            isImage
                              ? "bg-purple-950 text-purple-300 border-purple-600/50"
                              : "bg-emerald-950 text-emerald-300 border-emerald-600/50"
                          }`}
                        >
                          {key} ({comp.filler_mode || comp.type})
                        </span>
                      )}

                      <div className="flex items-center gap-1 truncate select-none">
                        {isImage ? (
                          <ImageIcon className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                        ) : (
                          <Type className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                        )}
                        <span className="text-[11px] font-mono text-slate-100 truncate">
                          {comp.filler_text || comp.filler_type || comp.entity || key}
                        </span>
                      </div>

                      {isSelected && (
                        <Move className="w-3 h-3 text-slate-300/70 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Pane: Field Inspector or Split JSON Editor */}
        <div className="w-80 lg:w-96 border-l border-slate-800 bg-slate-950 flex flex-col shrink-0 overflow-hidden">
          {viewMode === "json" || (viewMode === "split" && !selectedComp) ? (
            <div className="flex-1 flex flex-col p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  template.json
                </span>
                {rawJsonError && (
                  <span className="text-[11px] text-red-400 truncate max-w-[200px]" title={rawJsonError}>
                    JSON Error
                  </span>
                )}
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="flex-1 mt-2 bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          ) : selectedComp && selectedKey ? (
            /* Component Inspector Panel */
            <div className="flex-1 flex flex-col overflow-y-auto p-4 divide-y divide-slate-800/80 text-xs">
              {/* Header */}
              <div className="pb-3 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPrintedField ? "bg-sky-400" : selectedComp.type === "image" ? "bg-purple-400" : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {isPrintedField ? "Fixed Printed Field" : "Dynamic Component"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={selectedKey}
                    onChange={(e) => handleRenameKey(e.target.value)}
                    className="mt-1 bg-slate-900 border border-slate-700 text-sm font-semibold font-mono text-white px-2 py-1 rounded focus:outline-none focus:border-emerald-500 w-full"
                  />
                </div>

                <div className="flex items-center gap-1 pt-1">
                  <button
                    onClick={handleDuplicateSelected}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                    title="Duplicate Field"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition"
                    title="Delete Field"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Coordinates & Geometry */}
              <div className="py-3">
                <span className="font-semibold text-slate-300 block mb-2">Position & Dimensions</span>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="text-[10px] text-slate-500">X_LEFT (px)</label>
                    <input
                      type="number"
                      value={selectedComp.location?.x_left ?? 0}
                      onChange={(e) =>
                        updateSelectedComponent({
                          location: { ...selectedComp.location, x_left: parseInt(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Y_TOP (px)</label>
                    <input
                      type="number"
                      value={selectedComp.location?.y_top ?? 0}
                      onChange={(e) =>
                        updateSelectedComponent({
                          location: { ...selectedComp.location, y_top: parseInt(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">WIDTH (px)</label>
                    <input
                      type="number"
                      value={selectedComp.dims?.width ?? 200}
                      onChange={(e) =>
                        updateSelectedComponent({
                          dims: { ...(selectedComp.dims || { height: 40 }), width: parseInt(e.target.value) || 10 },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">HEIGHT (px)</label>
                    <input
                      type="number"
                      value={selectedComp.dims?.height ?? 40}
                      onChange={(e) =>
                        updateSelectedComponent({
                          dims: { ...(selectedComp.dims || { width: 200 }), height: parseInt(e.target.value) || 10 },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white"
                    />
                  </div>
                </div>

                {/* Nudge Buttons */}
                <div className="mt-2.5 flex items-center justify-between bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">Fine Nudge:</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => nudge(-1, 0)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-mono">← 1px</button>
                    <button onClick={() => nudge(1, 0)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-mono">→ 1px</button>
                    <button onClick={() => nudge(0, -1)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-mono">↑ 1px</button>
                    <button onClick={() => nudge(0, 1)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-mono">↓ 1px</button>
                  </div>
                </div>
              </div>

              {/* Data & Generator Rules */}
              {!isPrintedField && (
                <div className="py-3 space-y-2.5">
                  <span className="font-semibold text-slate-300 block">DocSim Data Generator</span>

                  <div>
                    <label className="text-[10px] text-slate-400">Filler Mode</label>
                    <select
                      value={selectedComp.filler_mode || "random"}
                      onChange={(e) => updateSelectedComponent({ filler_mode: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs mt-0.5"
                    >
                      <option value="random">random (name / face / text)</option>
                      <option value="regex">regex (custom pattern)</option>
                      <option value="fixed">fixed (constant text)</option>
                      <option value="transliteration">transliteration (from source field)</option>
                      <option value="array">array (options list)</option>
                      <option value="qr">qr (QR Code generator)</option>
                    </select>
                  </div>

                  {selectedComp.filler_mode === "fixed" && (
                    <div>
                      <label className="text-[10px] text-slate-400">Fixed Text</label>
                      <input
                        type="text"
                        value={selectedComp.filler_text || ""}
                        onChange={(e) => updateSelectedComponent({ filler_text: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs mt-0.5"
                      />
                    </div>
                  )}

                  {selectedComp.filler_mode === "regex" && (
                    <div>
                      <label className="text-[10px] text-slate-400">Regular Expression</label>
                      <input
                        type="text"
                        value={selectedComp.filler_regex || ""}
                        onChange={(e) => updateSelectedComponent({ filler_regex: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-emerald-400 font-mono text-xs mt-0.5"
                        placeholder="\\d\\d\\d\\d  \\d\\d\\d\\d"
                      />
                    </div>
                  )}

                  {selectedComp.filler_mode === "transliteration" && (
                    <div>
                      <label className="text-[10px] text-slate-400">Source Component</label>
                      <select
                        value={selectedComp.filler_source || ""}
                        onChange={(e) => updateSelectedComponent({ filler_source: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs mt-0.5"
                      >
                        <option value="">Select source field...</option>
                        {Object.keys(templateData?.components || {}).map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-slate-400">Ground Truth Entity Tag</label>
                    <input
                      type="text"
                      value={selectedComp.entity || ""}
                      onChange={(e) => updateSelectedComponent({ entity: e.target.value })}
                      placeholder="e.g. name, date_of_birth, id"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs mt-0.5 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Typography & Styling */}
              {selectedComp.type === "text" && (
                <div className="py-3 space-y-2.5">
                  <span className="font-semibold text-slate-300 block">Typography</span>

                  <div>
                    <label className="text-[10px] text-slate-400">Font File</label>
                    <select
                      value={selectedComp.font_file || templateData?.defaults?.font_files?.en || ""}
                      onChange={(e) => updateSelectedComponent({ font_file: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs mt-0.5"
                    >
                      <option value="">(Default Template Font)</option>
                      {AVAILABLE_FONTS.map((f) => (
                        <option key={f.path} value={f.path}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Font Size (px)</label>
                      <input
                        type="number"
                        value={selectedComp.font_size || templateData?.defaults?.font_size || 32}
                        onChange={(e) => updateSelectedComponent({ font_size: parseInt(e.target.value) || 20 })}
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs mt-0.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Language</label>
                      <select
                        value={selectedComp.lang || "en"}
                        onChange={(e) => updateSelectedComponent({ lang: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs mt-0.5 font-mono"
                      >
                        <option value="en">English (en)</option>
                        <option value="hi">Hindi (hi)</option>
                        <option value="ta">Tamil (ta)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Color (RGB)</label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <input
                        type="text"
                        value={selectedComp.font_color || "rgb(0,0,0)"}
                        onChange={(e) => updateSelectedComponent({ font_color: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs font-mono"
                      />
                      <div
                        className="w-6 h-6 rounded border border-slate-600 shrink-0"
                        style={{ backgroundColor: selectedComp.font_color || "rgb(0,0,0)" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <Layers className="w-8 h-8 text-slate-600 mb-2" />
              <p className="font-medium text-slate-300 text-xs">No Field Selected</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Click on any bounding box in the canvas to inspect and edit coordinates, fonts, or rules.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
