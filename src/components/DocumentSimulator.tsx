import React, { useState, useEffect, useRef } from "react";
import { DocSimTemplate, getComponentEntries } from "../types";
import {
  generateSyntheticFieldValues,
  ensureFontsLoaded,
  getFontFamilyName,
  drawSimpleQRCode,
} from "../utils/docsimGenerator";
import {
  RefreshCw,
  Download,
  FileJson,
  Layers,
  ZoomIn,
  ZoomOut,
  Sliders,
  CheckCircle,
  Eye,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import JSZip from "jszip";

interface DocumentSimulatorProps {
  initialPath?: string;
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

export const DocumentSimulator: React.FC<DocumentSimulatorProps> = ({ initialPath }) => {
  const [selectedPath, setSelectedPath] = useState(initialPath || "templates/Aadhaar/Front/template.json");
  const [template, setTemplate] = useState<DocSimTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showGroundTruth, setShowGroundTruth] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(0.85);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);

  // Load template
  useEffect(() => {
    loadTemplate(selectedPath);
  }, [selectedPath]);

  const loadTemplate = async (path: string) => {
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.success && data.content) {
        const parsed: DocSimTemplate = JSON.parse(data.content);
        setTemplate(parsed);
        await ensureFontsLoaded(parsed);
        const synthetic = generateSyntheticFieldValues(parsed);
        setFieldValues(synthetic);
      }
    } catch (e) {
      console.error("Error loading template for simulation:", e);
    }
  };

  // Re-generate random synthetic data
  const handleRandomize = () => {
    if (!template) return;
    setIsGenerating(true);
    const synthetic = generateSyntheticFieldValues(template);
    setFieldValues(synthetic);
    setTimeout(() => setIsGenerating(false), 200);
  };

  // Render to canvas whenever template or fieldValues change
  useEffect(() => {
    if (!template) return;

    let isMounted = true;
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Load background image
      const bg = new Image();
      bg.crossOrigin = "anonymous";
      bg.src = `/repo-assets/${template.background_img}`;

      await new Promise((resolve) => {
        bg.onload = resolve;
        bg.onerror = resolve;
      });
      if (!isMounted) return;

      canvas.width = bg.naturalWidth || 1000;
      canvas.height = bg.naturalHeight || 640;

      // Draw background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // Draw printed static fields
      for (const [key, field] of getComponentEntries(template.printed_fields)) {
        if (!field.location) continue;
        const fontName = getFontFamilyName(field.font_file || template.defaults?.font_files?.[field.lang || "en"] || "");
        const fontSize = field.font_size || template.defaults?.font_size || 32;
        ctx.font = `${fontSize}px "${fontName}", Arial, sans-serif`;
        ctx.fillStyle = field.font_color || template.defaults?.font_color || "rgb(0,0,0)";
        ctx.textBaseline = "top";
        const text = fieldValues[`printed_${key}`] || field.text || "";
        ctx.fillText(text, field.location.x_left, field.location.y_top);
      }

      // Draw dynamic components
      for (const [key, comp] of getComponentEntries(template.components)) {
        if (!comp.location) continue;
        const val = fieldValues[key];

        if (comp.type === "image") {
          const w = comp.dims?.width || 180;
          const h = comp.dims?.height || 220;

          if (comp.filler_mode === "qr" || key.toLowerCase().includes("qr")) {
            drawSimpleQRCode(ctx, val || "DOCSIM-SAMPLE", comp.location.x_left, comp.location.y_top, w, h);
          } else {
            // Draw person photo
            const photoImg = new Image();
            photoImg.crossOrigin = "anonymous";
            photoImg.src = val || "/repo-assets/images/people/female_generic.png";

            await new Promise((resolve) => {
              photoImg.onload = resolve;
              photoImg.onerror = resolve;
            });
            if (!isMounted) return;

            ctx.drawImage(photoImg, comp.location.x_left, comp.location.y_top, w, h);
          }
        } else {
          // Text component
          const fontName = getFontFamilyName(comp.font_file || template.defaults?.font_files?.[comp.lang || "en"] || "");
          const fontSize = comp.font_size || template.defaults?.font_size || 32;
          ctx.font = `${fontSize}px "${fontName}", Arial, sans-serif`;
          ctx.fillStyle = comp.font_color || template.defaults?.font_color || "rgb(0,0,0)";
          ctx.textBaseline = "top";
          ctx.fillText(val || "", comp.location.x_left, comp.location.y_top);
        }

        // Draw ground truth boxes if enabled
        if (showGroundTruth) {
          const w = comp.dims?.width || (comp.type === "image" ? 180 : 220);
          const h = comp.dims?.height || (comp.type === "image" ? 220 : 36);

          ctx.strokeStyle = comp.type === "image" ? "#a855f7" : "#10b981";
          ctx.lineWidth = 2;
          ctx.strokeRect(comp.location.x_left, comp.location.y_top, w, h);

          // Box label
          ctx.fillStyle = comp.type === "image" ? "#a855f7" : "#10b981";
          ctx.font = "bold 13px monospace";
          ctx.fillText(
            `[${comp.entity || key}]`,
            comp.location.x_left,
            Math.max(0, comp.location.y_top - 16)
          );
        }
      }
    };

    render();
    return () => {
      isMounted = false;
    };
  }, [template, fieldValues, showGroundTruth]);

  // Download image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `${template?.doc_name || "synthetic_document"}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  // Download ground truth json
  const handleDownloadGroundTruth = () => {
    if (!template) return;
    const gt = {
      document_name: template.doc_name,
      width: canvasRef.current?.width || 1000,
      height: canvasRef.current?.height || 640,
      annotations: getComponentEntries(template.components).map(([key, comp]) => ({
        key,
        entity: comp.entity || key,
        type: comp.type,
        text: fieldValues[key] || "",
        bbox: [
          comp.location?.y_top || 0,
          comp.location?.x_left || 0,
          (comp.location?.y_top || 0) + (comp.dims?.height || 36),
          (comp.location?.x_left || 0) + (comp.dims?.width || 200),
        ],
      })),
    };

    const blob = new Blob([JSON.stringify(gt, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `${template.doc_name}_ground_truth.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Batch generate 5 samples into a ZIP
  const handleBatchGenerate = async () => {
    if (!template) return;
    const zip = new JSZip();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bg = new Image();
    bg.crossOrigin = "anonymous";
    bg.src = `/repo-assets/${template.background_img}`;
    await new Promise((r) => (bg.onload = r));

    canvas.width = bg.naturalWidth || 1000;
    canvas.height = bg.naturalHeight || 640;

    for (let i = 1; i <= 5; i++) {
      const syntheticValues = generateSyntheticFieldValues(template);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // Printed fields
      for (const [key, field] of getComponentEntries(template.printed_fields)) {
        if (!field.location) continue;
        const fontName = getFontFamilyName(field.font_file || template.defaults?.font_files?.[field.lang || "en"] || "");
        const fontSize = field.font_size || template.defaults?.font_size || 32;
        ctx.font = `${fontSize}px "${fontName}", Arial, sans-serif`;
        ctx.fillStyle = field.font_color || template.defaults?.font_color || "rgb(0,0,0)";
        ctx.textBaseline = "top";
        ctx.fillText(field.text || "", field.location.x_left, field.location.y_top);
      }

      // Dynamic components
      for (const [key, comp] of getComponentEntries(template.components)) {
        if (!comp.location) continue;
        const val = syntheticValues[key];

        if (comp.type === "image") {
          const w = comp.dims?.width || 180;
          const h = comp.dims?.height || 220;
          if (comp.filler_mode === "qr" || key.toLowerCase().includes("qr")) {
            drawSimpleQRCode(ctx, val || "SAMPLE-QR", comp.location.x_left, comp.location.y_top, w, h);
          } else {
            const photoImg = new Image();
            photoImg.crossOrigin = "anonymous";
            photoImg.src = val || "/repo-assets/images/people/female_generic.png";
            await new Promise((r) => (photoImg.onload = r));
            ctx.drawImage(photoImg, comp.location.x_left, comp.location.y_top, w, h);
          }
        } else {
          const fontName = getFontFamilyName(comp.font_file || template.defaults?.font_files?.[comp.lang || "en"] || "");
          const fontSize = comp.font_size || template.defaults?.font_size || 32;
          ctx.font = `${fontSize}px "${fontName}", Arial, sans-serif`;
          ctx.fillStyle = comp.font_color || template.defaults?.font_color || "rgb(0,0,0)";
          ctx.textBaseline = "top";
          ctx.fillText(val || "", comp.location.x_left, comp.location.y_top);
        }
      }

      const imgData = canvas.toDataURL("image/jpeg", 0.95).split(",")[1];
      zip.file(`sample_${i}.jpg`, imgData, { base64: true });
      zip.file(
        `sample_${i}_gt.json`,
        JSON.stringify(
          {
            sample_id: i,
            template: template.doc_name,
            values: syntheticValues,
          },
          null,
          2
        )
      );
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `${template.doc_name}_batch_5samples.zip`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Template:</label>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 text-sm rounded-md px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none font-medium"
          >
            {PRESET_TEMPLATES.map((tmpl) => (
              <option key={tmpl.path} value={tmpl.path}>
                {tmpl.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleRandomize}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium px-3.5 py-1.5 rounded-md shadow transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>Randomize Synthetic Data</span>
          </button>

          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 ml-2">
            <input
              type="checkbox"
              checked={showGroundTruth}
              onChange={(e) => setShowGroundTruth(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span>Show Ground Truth Boxes</span>
          </label>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadImage}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition"
            title="Download full resolution generated PNG"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handleDownloadGroundTruth}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition"
            title="Download Ground Truth JSON annotations"
          >
            <FileJson className="w-3.5 h-3.5 text-sky-400" />
            <span>Ground Truth JSON</span>
          </button>

          <button
            onClick={handleBatchGenerate}
            className="inline-flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium px-3 py-1.5 rounded-md shadow transition"
            title="Generate 5 synthetic samples with ground truth in a ZIP"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch (5x ZIP)</span>
          </button>
        </div>
      </div>

      {/* Main split: Canvas Viewport + Field Customizer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/60 overflow-hidden">
          {/* Zoom header */}
          <div className="h-9 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
            <span className="font-mono text-[11px]">
              Synthetic Output: {canvasRef.current?.width || 1000}x{canvasRef.current?.height || 640}px
            </span>
            <div className="flex items-center gap-2 font-mono">
              <button onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} className="p-1 hover:bg-slate-800 rounded">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(2.0, zoom + 0.1))} className="p-1 hover:bg-slate-800 rounded">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(0.85)}
                className="text-[10px] px-1.5 py-0.5 border border-slate-700 rounded hover:bg-slate-800"
              >
                Fit
              </button>
            </div>
          </div>

          {/* Canvas Scroll Viewport */}
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
              className="shadow-2xl rounded border border-slate-700/80 overflow-hidden transition-transform duration-75"
            >
              <canvas ref={canvasRef} className="block max-w-none" />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Field Value Editor & Overrides */}
        <div className="w-80 lg:w-96 border-l border-slate-800 bg-slate-950 flex flex-col shrink-0 overflow-hidden">
          <div className="h-10 px-4 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Field Values & Overrides
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {Object.keys(template?.components || {}).length} dynamic fields
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-slate-800/80 text-xs">
            {getComponentEntries(template?.components).map(([key, comp]) => {
              const isImage = comp.type === "image";
              return (
                <div key={key} className="pt-3 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300 font-mono truncate max-w-[180px]">{key}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {comp.entity || comp.filler_mode || comp.type}
                    </span>
                  </div>

                  {isImage ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={fieldValues[key] || ""}
                        onChange={(e) => setFieldValues({ ...fieldValues, [key]: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                      >
                        <option value="/repo-assets/images/people/female_generic.png">Female Portrait (Generic)</option>
                        <option value="/repo-assets/images/people/male_generic.jpg">Male Portrait (Generic)</option>
                        {comp.filler_mode === "qr" && <option value="QR-CODE-VAL">Auto Simulated QR</option>}
                      </select>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={fieldValues[key] || ""}
                      onChange={(e) => setFieldValues({ ...fieldValues, [key]: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
