import React, { useState, useEffect, useRef } from "react";
import { PsdDocumentData, PsdLayerItem, DocSimTemplate } from "../types";
import {
  parsePsdFromUint8,
  generatePsdUint8Array,
  convertPsdToDocSimTemplate,
} from "../utils/psdHelper";
import {
  Layers,
  Eye,
  EyeOff,
  Type,
  Image as ImageIcon,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  FileCode,
  Sparkles,
  Move,
  Grid,
  RefreshCw,
  FolderOpen,
  HelpCircle,
  ExternalLink,
  CreditCard
} from "lucide-react";

interface PsdEditorProps {
  initialPsdPath?: string;
  onConvertToTemplate?: (templatePath: string) => void;
  onOpenRealCardStudio?: (psdPath: string) => void;
}

export const PsdEditor: React.FC<PsdEditorProps> = ({
  initialPsdPath = "templates/Aadhaar/Front/template.psd",
  onConvertToTemplate,
  onOpenRealCardStudio,
}) => {
  const [psdPath, setPsdPath] = useState(initialPsdPath);
  const [availablePsds, setAvailablePsds] = useState<string[]>([]);
  const [docData, setDocData] = useState<PsdDocumentData | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [showGrid, setShowGrid] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Conversion Modal State
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertedTemplate, setConvertedTemplate] = useState<DocSimTemplate | null>(null);
  const [convertFolderName, setConvertFolderName] = useState("Custom-ID-Card");
  const [isConverting, setIsConverting] = useState(false);

  // Dragging & Resizing state on Canvas
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [initialLayerBounds, setInitialLayerBounds] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageLayerInputRef = useRef<HTMLInputElement>(null);

  // Fetch available PSD files in repository
  useEffect(() => {
    fetchAvailablePsds();
  }, []);

  const fetchAvailablePsds = async () => {
    try {
      const res = await fetch("/api/psds");
      const data = await res.json();
      if (data.success && data.psds && data.psds.length > 0) {
        setAvailablePsds(data.psds);
      }
    } catch (e) {
      console.error("Failed to fetch PSD list:", e);
    }
  };

  // Load selected PSD file
  useEffect(() => {
    if (psdPath) {
      loadPsdFile(psdPath);
    }
  }, [psdPath]);

  const loadPsdFile = async (filePath: string) => {
    setIsLoading(true);
    setStatusMessage(`Loading PSD: ${filePath}...`);
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.success && data.base64) {
        const binaryStr = atob(data.base64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const fileName = filePath.split("/").pop() || "Document.psd";
        const parsed = parsePsdFromUint8(bytes, fileName);
        parsed.path = filePath;
        setDocData(parsed);

        // Select first text layer by default
        const firstText = parsed.layers.find((l) => l.type === "text" && l.visible);
        if (firstText) {
          setSelectedLayerId(firstText.id);
        } else if (parsed.layers.length > 0) {
          setSelectedLayerId(parsed.layers[0].id);
        }
        setStatusMessage(null);
      } else {
        setStatusMessage("Failed to load PSD file.");
      }
    } catch (e: any) {
      console.error("Error loading PSD:", e);
      setStatusMessage(`Error loading PSD: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render PSD Layers to Canvas
  useEffect(() => {
    if (!docData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = docData.width;
    canvas.height = docData.height;

    // Clear canvas
    ctx.clearRect(0, 0, docData.width, docData.height);

    // Default white card background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, docData.width, docData.height);

    // Draw layers from bottom to top (in Photoshop stack order, bottom layer is at the end of array, but let's render bottom-up)
    // In our array, index 0 is background / bottom layer
    docData.layers.forEach((layer) => {
      if (!layer.visible) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;

      if (layer.type === "text" && layer.text) {
        ctx.font = `${layer.fontSize || 24}px ${layer.fontFamily || "sans-serif"}`;
        ctx.fillStyle = layer.fontColor || "#111827";
        ctx.textBaseline = "top";
        ctx.textAlign = layer.textAlign || "left";

        const textX =
          layer.textAlign === "center"
            ? layer.left + layer.width / 2
            : layer.textAlign === "right"
            ? layer.left + layer.width
            : layer.left;

        // Multiline support
        const lines = layer.text.split("\n");
        const lineHeight = (layer.fontSize || 24) * 1.25;
        lines.forEach((line, i) => {
          ctx.fillText(line, textX, layer.top + i * lineHeight);
        });
      } else if (layer.type === "image" && layer.imageDataUrl) {
        const img = new Image();
        img.src = layer.imageDataUrl;
        if (img.complete) {
          ctx.drawImage(img, layer.left, layer.top, layer.width, layer.height);
        } else {
          img.onload = () => {
            ctx.drawImage(img, layer.left, layer.top, layer.width, layer.height);
          };
        }
      } else {
        // Shape or background layer placeholder
        ctx.fillStyle = layer.id.includes("base") || layer.name.toLowerCase().includes("back")
          ? "#f3f4f6"
          : "#e5e7eb";
        ctx.fillRect(layer.left, layer.top, layer.width, layer.height);

        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 1;
        ctx.strokeRect(layer.left, layer.top, layer.width, layer.height);
      }

      ctx.restore();
    });
  }, [docData]);

  // Handle Layer Selection
  const selectedLayer = docData?.layers.find((l) => l.id === selectedLayerId);

  const updateSelectedLayer = (updates: Partial<PsdLayerItem>) => {
    if (!docData || !selectedLayerId) return;

    setDocData({
      ...docData,
      layers: docData.layers.map((l) => (l.id === selectedLayerId ? { ...l, ...updates } : l)),
    });
  };

  // Add new text layer
  const handleAddTextLayer = () => {
    if (!docData) return;
    const newId = `layer_${Date.now()}_text`;
    const newLayer: PsdLayerItem = {
      id: newId,
      name: `Text Layer ${docData.layers.length + 1}`,
      type: "text",
      left: 100,
      top: 100,
      width: 260,
      height: 40,
      opacity: 1,
      visible: true,
      text: "New Text Field",
      fontSize: 24,
      fontFamily: "Arial",
      fontColor: "#111827",
      textAlign: "left",
    };

    setDocData({
      ...docData,
      layers: [...docData.layers, newLayer],
    });
    setSelectedLayerId(newId);
  };

  // Add new image layer
  const handleAddImageLayer = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!docData || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newId = `layer_${Date.now()}_img`;
      const newLayer: PsdLayerItem = {
        id: newId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: "image",
        left: 120,
        top: 120,
        width: 180,
        height: 220,
        opacity: 1,
        visible: true,
        imageDataUrl: dataUrl,
      };

      setDocData({
        ...docData,
        layers: [...docData.layers, newLayer],
      });
      setSelectedLayerId(newId);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Duplicate selected layer
  const handleDuplicateLayer = () => {
    if (!docData || !selectedLayer) return;
    const duplicated: PsdLayerItem = {
      ...selectedLayer,
      id: `layer_${Date.now()}_copy`,
      name: `${selectedLayer.name} Copy`,
      left: selectedLayer.left + 20,
      top: selectedLayer.top + 20,
    };
    setDocData({
      ...docData,
      layers: [...docData.layers, duplicated],
    });
    setSelectedLayerId(duplicated.id);
  };

  // Delete selected layer
  const handleDeleteLayer = () => {
    if (!docData || !selectedLayerId) return;
    const nextLayers = docData.layers.filter((l) => l.id !== selectedLayerId);
    setDocData({
      ...docData,
      layers: nextLayers,
    });
    setSelectedLayerId(nextLayers.length > 0 ? nextLayers[nextLayers.length - 1].id : null);
  };

  // Move layer order in stack
  const handleMoveLayerOrder = (direction: "up" | "down") => {
    if (!docData || !selectedLayerId) return;
    const index = docData.layers.findIndex((l) => l.id === selectedLayerId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= docData.layers.length) return;

    const nextLayers = [...docData.layers];
    const temp = nextLayers[index];
    nextLayers[index] = nextLayers[newIndex];
    nextLayers[newIndex] = temp;

    setDocData({
      ...docData,
      layers: nextLayers,
    });
  };

  // Toggle visibility
  const handleToggleVisibility = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!docData) return;
    setDocData({
      ...docData,
      layers: docData.layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
    });
  };

  // Save PSD directly back to Git repository
  const handleSaveToGit = async () => {
    if (!docData) return;
    setIsSaving(true);
    try {
      const uint8 = generatePsdUint8Array(docData);
      // Convert Uint8Array to base64
      let binary = "";
      const len = uint8.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = btoa(binary);

      const targetPath = docData.path || psdPath;
      const res = await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: targetPath,
          base64,
          isBase64: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error("Failed to save PSD to Git:", e);
      alert("Error saving PSD file to repository");
    } finally {
      setIsSaving(false);
    }
  };

  // Download PSD file locally to open in Photoshop
  const handleDownloadPsd = () => {
    if (!docData) return;
    try {
      const uint8 = generatePsdUint8Array(docData);
      const blob = new Blob([uint8], { type: "image/vnd.adobe.photoshop" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = docData.name.endsWith(".psd") ? docData.name : `${docData.name}.psd`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate PSD download:", e);
      alert("Failed to export PSD file.");
    }
  };

  // Upload local PSD file
  const handleUploadPsd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuf = event.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuf);
        const parsed = parsePsdFromUint8(bytes, file.name);
        parsed.path = `templates/Custom/${file.name}`;
        setDocData(parsed);
        setPsdPath(parsed.path);
        setSelectedLayerId(parsed.layers[0]?.id || null);
      } catch (err: any) {
        console.error("Failed to parse uploaded PSD:", err);
        alert(`Failed to parse PSD: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Prepare Convert to DocSim Template
  const handlePrepareConversion = () => {
    if (!docData) return;
    const { template } = convertPsdToDocSimTemplate(docData, canvasRef.current);
    setConvertedTemplate(template);
    setConvertFolderName(
      docData.name.replace(/\.psd$/i, "").replace(/[^a-zA-Z0-9_-]/g, "_") || "Custom-Card"
    );
    setShowConvertModal(true);
  };

  // Execute Template Conversion & Save to DocSim Repo
  const handleExecuteConversion = async () => {
    if (!docData || !convertedTemplate || !canvasRef.current) return;
    setIsConverting(true);
    try {
      const targetDir = `templates/${convertFolderName}`;
      const templateJsonPath = `${targetDir}/template.json`;
      const backgroundJpgPath = `${targetDir}/background.jpg`;

      // Get background image data
      const bgDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.95);
      const bgBase64 = bgDataUrl.split(",")[1];

      // 1. Save background.jpg
      await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: backgroundJpgPath,
          base64: bgBase64,
          isBase64: true,
        }),
      });

      // 2. Save template.json
      await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: templateJsonPath,
          content: JSON.stringify(convertedTemplate, null, 2),
        }),
      });

      setShowConvertModal(false);
      if (onConvertToTemplate) {
        onConvertToTemplate(templateJsonPath);
      } else {
        alert(`Successfully converted PSD to DocSim Template at ${templateJsonPath}!`);
      }
    } catch (e) {
      console.error("Failed to convert PSD to template:", e);
      alert("Error saving converted DocSim template.");
    } finally {
      setIsConverting(false);
    }
  };

  // Create New Blank PSD Template
  const handleCreateBlankPsd = (preset: "cr80" | "a4") => {
    const width = preset === "cr80" ? 1000 : 1240;
    const height = preset === "cr80" ? 640 : 1754;
    const name = preset === "cr80" ? "New_ID_Card.psd" : "New_Document.psd";

    const blankDoc: PsdDocumentData = {
      name,
      path: `templates/Custom/${name}`,
      width,
      height,
      layers: [
        {
          id: "layer_base_bg",
          name: "Card Background",
          type: "shape",
          left: 0,
          top: 0,
          width,
          height,
          opacity: 1,
          visible: true,
        },
        {
          id: "layer_title_1",
          name: "Document Title",
          type: "text",
          left: 80,
          top: 40,
          width: 400,
          height: 40,
          opacity: 1,
          visible: true,
          text: "IDENTITY CARD / पहचान पत्र",
          fontSize: 32,
          fontFamily: "Arial",
          fontColor: "#111827",
          textAlign: "left",
        },
        {
          id: "layer_name_2",
          name: "Holder Name",
          type: "text",
          left: 80,
          top: 140,
          width: 350,
          height: 36,
          opacity: 1,
          visible: true,
          text: "Full Name Here",
          fontSize: 26,
          fontFamily: "Arial",
          fontColor: "#111827",
          textAlign: "left",
        },
        {
          id: "layer_id_3",
          name: "Card ID Number",
          type: "text",
          left: 80,
          top: 480,
          width: 400,
          height: 48,
          opacity: 1,
          visible: true,
          text: "9876 5432 1098",
          fontSize: 34,
          fontFamily: "Arial",
          fontColor: "#059669",
          textAlign: "left",
        },
      ],
    };

    setDocData(blankDoc);
    setPsdPath(blankDoc.path!);
    setSelectedLayerId("layer_title_1");
  };

  // Canvas Mouse Events for Drag & Resize
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!docData || !selectedLayer) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    // Check if clicked directly inside selected layer or on handle
    const isInside =
      clickX >= selectedLayer.left &&
      clickX <= selectedLayer.left + selectedLayer.width &&
      clickY >= selectedLayer.top &&
      clickY <= selectedLayer.top + selectedLayer.height;

    if (isInside) {
      setIsDragging(true);
      setDragStartPos({ x: clickX, y: clickY });
      setInitialLayerBounds({
        left: selectedLayer.left,
        top: selectedLayer.top,
        width: selectedLayer.width,
        height: selectedLayer.height,
      });
    } else {
      // Find which layer was clicked (search top-down)
      for (let i = docData.layers.length - 1; i >= 0; i--) {
        const l = docData.layers[i];
        if (
          l.visible &&
          clickX >= l.left &&
          clickX <= l.left + l.width &&
          clickY >= l.top &&
          clickY <= l.top + l.height
        ) {
          setSelectedLayerId(l.id);
          setIsDragging(true);
          setDragStartPos({ x: clickX, y: clickY });
          setInitialLayerBounds({
            left: l.left,
            top: l.top,
            width: l.width,
            height: l.height,
          });
          return;
        }
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !docData || !selectedLayer) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / zoom;
    const currentY = (e.clientY - rect.top) / zoom;

    const deltaX = Math.round(currentX - dragStartPos.x);
    const deltaY = Math.round(currentY - dragStartPos.y);

    if (dragHandle) {
      // Resizing handle logic
      let newW = initialLayerBounds.width;
      let newH = initialLayerBounds.height;
      let newX = initialLayerBounds.left;
      let newY = initialLayerBounds.top;

      if (dragHandle.includes("e")) newW = Math.max(20, initialLayerBounds.width + deltaX);
      if (dragHandle.includes("s")) newH = Math.max(20, initialLayerBounds.height + deltaY);
      if (dragHandle.includes("w")) {
        newW = Math.max(20, initialLayerBounds.width - deltaX);
        newX = initialLayerBounds.left + deltaX;
      }
      if (dragHandle.includes("n")) {
        newH = Math.max(20, initialLayerBounds.height - deltaY);
        newY = initialLayerBounds.top + deltaY;
      }

      updateSelectedLayer({ left: newX, top: newY, width: newW, height: newH });
    } else {
      // Dragging entire layer
      const newX = Math.max(0, initialLayerBounds.left + deltaX);
      const newY = Math.max(0, initialLayerBounds.top + deltaY);
      updateSelectedLayer({ left: newX, top: newY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragHandle(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              PSD File:
            </span>
            <div className="relative">
              <select
                value={psdPath}
                onChange={(e) => setPsdPath(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono pr-8"
              >
                {availablePsds.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".psd"
              onChange={handleUploadPsd}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-md border border-slate-700 transition"
              title="Upload Photoshop .PSD file from your computer"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Upload PSD</span>
            </button>

            <button
              onClick={() => handleCreateBlankPsd("cr80")}
              className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-md border border-slate-700 transition"
              title="Create new blank ID Card PSD"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New ID Card</span>
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-0.5 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1 text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Reset 100%"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`p-1.5 border rounded-md transition ${
              showGrid
                ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Toggle Alignment Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Open in Real Card Studio */}
          {onOpenRealCardStudio && (
            <button
              onClick={() => onOpenRealCardStudio(psdPath)}
              className="inline-flex items-center gap-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-md transition"
              title="Open this PSD in Real Card Studio"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real Card Studio</span>
            </button>
          )}

          {/* Convert to DocSim */}
          <button
            onClick={handlePrepareConversion}
            disabled={!docData}
            className="inline-flex items-center gap-1.5 text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium px-3.5 py-1.5 rounded-md shadow-md transition"
            title="Convert PSD layers to DocSim Template JSON & Background"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Convert to DocSim Template</span>
          </button>

          {/* Download PSD */}
          <button
            onClick={handleDownloadPsd}
            disabled={!docData}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition"
            title="Download Photoshop .PSD file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download .PSD</span>
          </button>

          {/* Save to Repository */}
          <button
            onClick={handleSaveToGit}
            disabled={isSaving || !docData}
            className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-1.5 rounded-md shadow transition"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? "Saved to Git!" : "Save PSD"}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Photoshop Layer Panel */}
        <div className="w-72 lg:w-80 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
          {/* Layer Panel Header & Action Icons */}
          <div className="h-11 px-3 border-b border-slate-800 flex items-center justify-between text-xs bg-slate-900/50">
            <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Layers ({docData?.layers.length || 0})
            </span>

            <div className="flex items-center gap-1">
              <input
                type="file"
                ref={imageLayerInputRef}
                accept="image/*"
                onChange={handleAddImageLayer}
                className="hidden"
              />
              <button
                onClick={handleAddTextLayer}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded"
                title="Add New Text Layer"
              >
                <Type className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => imageLayerInputRef.current?.click()}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded"
                title="Add New Image / Photo Layer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDuplicateLayer}
                disabled={!selectedLayer}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded disabled:opacity-30"
                title="Duplicate Layer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMoveLayerOrder("up")}
                disabled={!selectedLayer}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30"
                title="Bring Forward"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMoveLayerOrder("down")}
                disabled={!selectedLayer}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30"
                title="Send Backward"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDeleteLayer}
                disabled={!selectedLayer}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded disabled:opacity-30"
                title="Delete Layer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Layer Stacking List (Rendered from top layer to bottom) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 font-mono text-xs">
            {docData?.layers
              .slice()
              .reverse()
              .map((layer) => {
                const isSelected = selectedLayerId === layer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-300 font-medium border-l-2 border-emerald-400"
                        : "hover:bg-slate-900 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <button
                        onClick={(e) => handleToggleVisibility(layer.id, e)}
                        className="text-slate-400 hover:text-slate-200 shrink-0"
                      >
                        {layer.visible ? (
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </button>

                      {layer.type === "text" ? (
                        <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : layer.type === "image" ? (
                        <ImageIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      ) : (
                        <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      )}

                      <span className="truncate">{layer.name}</span>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {layer.type === "text"
                        ? `${layer.fontSize}px`
                        : `${layer.width}x${layer.height}`}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Document Dimensions Footer */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-950 text-[11px] font-mono text-slate-500 flex justify-between">
            <span>Canvas Size:</span>
            <span className="text-slate-300">
              {docData?.width || 0} × {docData?.height || 0} px
            </span>
          </div>
        </div>

        {/* Center: Visual Canvas Viewport */}
        <div className="flex-1 flex flex-col bg-slate-950/60 overflow-hidden relative">
          <div className="h-9 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
            <span className="font-mono text-[11px] text-slate-300">
              Photoshop Viewport • {docData?.name || "No document"}
            </span>
            <span className="text-[11px] text-slate-500">
              Click & Drag to move layers • Use handles to resize
            </span>
          </div>

          <div
            className="flex-1 overflow-auto p-8 flex items-center justify-center relative bg-slate-950/90"
            style={{
              backgroundImage: showGrid
                ? "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)"
                : "none",
              backgroundSize: "20px 20px",
            }}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono">{statusMessage || "Parsing Photoshop PSD..."}</p>
              </div>
            ) : !docData ? (
              <div className="text-center text-slate-500">
                <Layers className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-medium">No PSD Document Loaded</p>
                <p className="text-xs mt-1">Upload a .psd file or choose a sample above.</p>
              </div>
            ) : (
              <div
                className="relative shadow-2xl rounded border border-slate-700/80 overflow-visible transition-transform duration-75"
                style={{
                  width: `${docData.width * zoom}px`,
                  height: `${docData.height * zoom}px`,
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
              >
                {/* Rendered HTML5 Canvas */}
                <canvas
                  ref={canvasRef}
                  style={{
                    width: `${docData.width * zoom}px`,
                    height: `${docData.height * zoom}px`,
                  }}
                  className="block bg-white"
                />

                {/* Selected Layer Bounding Box & Transform Handles */}
                {selectedLayer && selectedLayer.visible && (
                  <div
                    className="absolute border-2 border-emerald-400 pointer-events-none z-20"
                    style={{
                      left: `${selectedLayer.left * zoom}px`,
                      top: `${selectedLayer.top * zoom}px`,
                      width: `${selectedLayer.width * zoom}px`,
                      height: `${selectedLayer.height * zoom}px`,
                    }}
                  >
                    {/* Layer Name Tag */}
                    <div className="absolute -top-6 left-0 bg-emerald-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                      {selectedLayer.name} ({selectedLayer.width}×{selectedLayer.height})
                    </div>

                    {/* 8 Resize Handles */}
                    {[
                      { handle: "nw", pos: "-top-1.5 -left-1.5 cursor-nwse-resize" },
                      { handle: "n", pos: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
                      { handle: "ne", pos: "-top-1.5 -right-1.5 cursor-nesw-resize" },
                      { handle: "e", pos: "top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize" },
                      { handle: "se", pos: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
                      {
                        handle: "s",
                        pos: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
                      },
                      { handle: "sw", pos: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
                      { handle: "w", pos: "top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize" },
                    ].map((h) => (
                      <div
                        key={h.handle}
                        className={`absolute w-3 h-3 bg-white border-2 border-emerald-500 rounded-sm pointer-events-auto ${h.pos}`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsDragging(true);
                          setDragHandle(h.handle);
                          setDragStartPos({ x: e.clientX / zoom, y: e.clientY / zoom });
                          setInitialLayerBounds({
                            left: selectedLayer.left,
                            top: selectedLayer.top,
                            width: selectedLayer.width,
                            height: selectedLayer.height,
                          });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Layer Inspector & Property Editor */}
        <div className="w-80 lg:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-200 tracking-wider uppercase text-[11px]">
              Layer Properties
            </span>
            {selectedLayer && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                {selectedLayer.type}
              </span>
            )}
          </div>

          {!selectedLayer ? (
            <div className="py-8 text-center text-slate-500">
              <Move className="w-6 h-6 mx-auto mb-2 text-slate-700" />
              <p>Select any layer from the list or canvas to edit its properties.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Layer Name */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Layer Name</label>
                <input
                  type="text"
                  value={selectedLayer.name}
                  onChange={(e) => updateSelectedLayer({ name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Coordinates & Geometry */}
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-2.5">
                <span className="font-semibold text-slate-300 block text-[11px]">
                  Transform Coordinates
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500">X (Left)</span>
                    <input
                      type="number"
                      value={selectedLayer.left}
                      onChange={(e) =>
                        updateSelectedLayer({ left: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Y (Top)</span>
                    <input
                      type="number"
                      value={selectedLayer.top}
                      onChange={(e) => updateSelectedLayer({ top: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Width</span>
                    <input
                      type="number"
                      value={selectedLayer.width}
                      onChange={(e) =>
                        updateSelectedLayer({ width: Math.max(10, parseInt(e.target.value) || 10) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Height</span>
                    <input
                      type="number"
                      value={selectedLayer.height}
                      onChange={(e) =>
                        updateSelectedLayer({
                          height: Math.max(10, parseInt(e.target.value) || 10),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Opacity */}
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Opacity</span>
                    <span className="font-mono text-emerald-400">
                      {Math.round((selectedLayer.opacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedLayer.opacity ?? 1}
                    onChange={(e) =>
                      updateSelectedLayer({ opacity: parseFloat(e.target.value) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Text Layer Typography Controls */}
              {selectedLayer.type === "text" && (
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-3">
                  <span className="font-semibold text-slate-300 block text-[11px]">
                    Typography & Content
                  </span>

                  {/* Text string */}
                  <div className="space-y-1">
                    <label className="text-slate-400">Text Content</label>
                    <textarea
                      rows={3}
                      value={selectedLayer.text || ""}
                      onChange={(e) => updateSelectedLayer({ text: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 text-xs font-sans focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Font Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Font Size</span>
                      <span className="font-mono text-emerald-400">
                        {selectedLayer.fontSize || 24}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="72"
                      step="1"
                      value={selectedLayer.fontSize || 24}
                      onChange={(e) =>
                        updateSelectedLayer({ fontSize: parseInt(e.target.value) || 24 })
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Font Family */}
                  <div className="space-y-1">
                    <label className="text-slate-400">Font Family</label>
                    <select
                      value={selectedLayer.fontFamily || "Arial"}
                      onChange={(e) => updateSelectedLayer({ fontFamily: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Arial">Arial (Standard Sans)</option>
                      <option value="Noto Sans Devanagari, Arial">
                        Noto Sans Devanagari (Hindi)
                      </option>
                      <option value="Nirmala UI, Arial">Nirmala UI (Indic Universal)</option>
                      <option value="Courier New">Courier New (Monospace / Codes)</option>
                      <option value="Times New Roman">Times New Roman (Serif)</option>
                      <option value="Impact">Impact (Heavy Title)</option>
                    </select>
                  </div>

                  {/* Font Color */}
                  <div className="space-y-1">
                    <label className="text-slate-400">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          selectedLayer.fontColor?.startsWith("#")
                            ? selectedLayer.fontColor
                            : "#000000"
                        }
                        onChange={(e) => updateSelectedLayer({ fontColor: e.target.value })}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-slate-900 p-0.5"
                      />
                      <input
                        type="text"
                        value={selectedLayer.fontColor || "#111827"}
                        onChange={(e) => updateSelectedLayer({ fontColor: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Alignment */}
                  <div className="space-y-1">
                    <label className="text-slate-400">Alignment</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() => updateSelectedLayer({ textAlign: align })}
                          className={`py-1 text-[11px] rounded capitalize transition ${
                            selectedLayer.textAlign === align
                              ? "bg-emerald-600 text-white font-medium"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Image Layer Controls */}
              {selectedLayer.type === "image" && (
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-3">
                  <span className="font-semibold text-slate-300 block text-[11px]">
                    Image Bitmap
                  </span>

                  {selectedLayer.imageDataUrl ? (
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-center">
                      <img
                        src={selectedLayer.imageDataUrl}
                        alt="Layer bitmap"
                        className="max-h-36 max-w-full object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950 rounded border border-slate-800 text-center text-slate-500">
                      No image data loaded
                    </div>
                  )}

                  <input
                    type="file"
                    id="replace-image-input"
                    accept="image/*"
                    onChange={(e) => {
                      if (!e.target.files || !e.target.files[0]) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        updateSelectedLayer({ imageDataUrl: event.target?.result as string });
                      };
                      reader.readAsDataURL(e.target.files[0]);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />

                  <button
                    onClick={() => document.getElementById("replace-image-input")?.click()}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-medium transition"
                  >
                    Replace Image Data...
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Convert to DocSim Template Modal */}
      {showConvertModal && convertedTemplate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">
                  Convert PSD to DocSim Template
                </h3>
              </div>
              <button
                onClick={() => setShowConvertModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300">
              DocSim Studio automatically mapped your Photoshop layers to{" "}
              <span className="font-mono text-emerald-400">
                {Object.keys(convertedTemplate.components).length} dynamic components
              </span>{" "}
              and{" "}
              <span className="font-mono text-emerald-400">
                {Object.keys(convertedTemplate.printed_fields || {}).length} fixed fields
              </span>
              .
            </p>

            {/* Folder Destination Input */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Save to Repository Directory:</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-500">templates/</span>
                <input
                  type="text"
                  value={convertFolderName}
                  onChange={(e) => setConvertFolderName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Preview generated JSON */}
            <div className="space-y-1">
              <label className="text-slate-400">Generated template.json Preview:</label>
              <pre className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-300 max-h-56 overflow-y-auto">
                {JSON.stringify(convertedTemplate, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteConversion}
                disabled={isConverting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center gap-1.5 shadow"
              >
                {isConverting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Save and Open in Visual Template Designer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
