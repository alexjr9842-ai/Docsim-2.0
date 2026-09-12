import React, { useState, useEffect, useRef } from "react";
import { AugmentationConfig } from "../types";
import {
  Save,
  RefreshCw,
  Sliders,
  Check,
  Zap,
  Eye,
  Columns2,
  Sparkles,
  Download
} from "lucide-react";

export const AugmentationEditor: React.FC = () => {
  const [config, setConfig] = useState<AugmentationConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activePreset, setActivePreset] = useState("templates/sample_augmentation/config.json");

  // Filter preview values
  const [blurAmount, setBlurAmount] = useState(1.5);
  const [noiseAmount, setNoiseAmount] = useState(15);
  const [contrastGain, setContrastGain] = useState(1.15);
  const [brightness, setBrightness] = useState(1.0);
  const [grayscale, setGrayscale] = useState(false);
  const [perspectiveAngle, setPerspectiveAngle] = useState(3);
  const [paperFolds, setPaperFolds] = useState(true);
  const [splitPosition, setSplitPosition] = useState(50); // percentage for split view

  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load configuration from Git repo
  useEffect(() => {
    loadConfig();
  }, [activePreset]);

  const loadConfig = async () => {
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(activePreset)}`);
      const data = await res.json();
      if (data.success && data.content) {
        const parsed: AugmentationConfig = JSON.parse(data.content);
        setConfig(parsed);
        setIsDirty(false);
        // Sync sliders from config
        if (parsed.augmentations?.gaussian_blur) {
          setBlurAmount(parsed.augmentations.gaussian_blur.sigma_max || 1.5);
        }
        if (parsed.augmentations?.contrast) {
          setContrastGain(parsed.augmentations.contrast.min_gain ? parsed.augmentations.contrast.min_gain / 6 : 1.15);
        }
      }
    } catch (e) {
      console.error("Error loading augmentation config:", e);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: activePreset,
          content: JSON.stringify(config, null, 4),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error("Failed to save config:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Render original image and augmented image
  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/repo-assets/documentation/demo/template.jpg";

    img.onload = () => {
      if (!isMounted) return;
      const srcCanvas = sourceCanvasRef.current;
      const outCanvas = outputCanvasRef.current;
      if (!srcCanvas || !outCanvas) return;

      const w = img.naturalWidth || 600;
      const h = img.naturalHeight || 380;

      srcCanvas.width = w;
      srcCanvas.height = h;
      outCanvas.width = w;
      outCanvas.height = h;

      const srcCtx = srcCanvas.getContext("2d");
      const outCtx = outCanvas.getContext("2d");
      if (!srcCtx || !outCtx) return;

      // Draw original
      srcCtx.drawImage(img, 0, 0, w, h);

      // Apply augmentations to output canvas
      outCtx.clearRect(0, 0, w, h);

      // 1. Perspective tilt transform
      outCtx.save();
      if (perspectiveAngle !== 0) {
        outCtx.translate(w / 2, h / 2);
        outCtx.rotate((perspectiveAngle * Math.PI) / 180);
        outCtx.scale(0.96, 0.98);
        outCtx.translate(-w / 2, -h / 2);
      }

      // 2. Base draw with CSS filter string
      outCtx.filter = `blur(${blurAmount}px) contrast(${contrastGain * 100}%) brightness(${brightness * 100}%) ${
        grayscale ? "grayscale(100%)" : ""
      }`;
      outCtx.drawImage(img, 0, 0, w, h);
      outCtx.filter = "none";
      outCtx.restore();

      // 3. Add additive noise
      if (noiseAmount > 0) {
        const imgData = outCtx.getImageData(0, 0, w, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const rand = (Math.random() - 0.5) * noiseAmount * 2;
          data[i] = Math.min(255, Math.max(0, data[i] + rand));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + rand));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + rand));
        }
        outCtx.putImageData(imgData, 0, 0);
      }

      // 4. Add paper crease shadow
      if (paperFolds) {
        outCtx.save();
        outCtx.strokeStyle = "rgba(0,0,0,0.15)";
        outCtx.lineWidth = 3;
        outCtx.beginPath();
        outCtx.moveTo(w * 0.48, 0);
        outCtx.lineTo(w * 0.52, h);
        outCtx.stroke();

        outCtx.strokeStyle = "rgba(255,255,255,0.2)";
        outCtx.lineWidth = 2;
        outCtx.beginPath();
        outCtx.moveTo(w * 0.48 + 2, 0);
        outCtx.lineTo(w * 0.52 + 2, h);
        outCtx.stroke();
        outCtx.restore();
      }
    };

    return () => {
      isMounted = false;
    };
  }, [blurAmount, noiseAmount, contrastGain, brightness, grayscale, perspectiveAngle, paperFolds]);

  const randomizeAugmentations = () => {
    setBlurAmount(parseFloat((0.2 + Math.random() * 2.0).toFixed(2)));
    setNoiseAmount(Math.round(5 + Math.random() * 25));
    setContrastGain(parseFloat((0.85 + Math.random() * 0.5).toFixed(2)));
    setBrightness(parseFloat((0.85 + Math.random() * 0.3).toFixed(2)));
    setGrayscale(Math.random() > 0.6);
    setPerspectiveAngle(Math.round((Math.random() - 0.5) * 6));
    setPaperFolds(Math.random() > 0.4);
  };

  const updateConfigValue = (section: string, key: string, val: any) => {
    if (!config) return;
    const newConfig = { ...config };
    if (!newConfig.augmentations[section]) newConfig.augmentations[section] = {};
    newConfig.augmentations[section][key] = val;
    setConfig(newConfig);
    setIsDirty(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Action Header */}
      <div className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Augmentation Recipe:</span>
          <span className="text-sm font-mono text-emerald-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded">
            sample_augmentation/config.json
          </span>

          {isDirty && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={randomizeAugmentations}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate Random Epoch</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-1.5 rounded-md shadow transition"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? "Saved to Git!" : "Save Config"}</span>
          </button>
        </div>
      </div>

      {/* Main Split: Before/After Comparison & Parameter Tuner */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Before vs After Interactive Viewport */}
        <div className="flex-1 flex flex-col bg-slate-950/60 overflow-hidden">
          <div className="h-10 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
            <div className="flex items-center gap-2 font-medium">
              <Columns2 className="w-4 h-4 text-emerald-400" />
              <span>Side-by-Side: Original Document vs. Augmented Output</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Live WebGL / Canvas Degradation Shader</span>
          </div>

          <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
              {/* Original Card */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Ground Truth Original
                </span>
                <div className="shadow-2xl rounded-lg border border-slate-700/80 overflow-hidden bg-slate-900">
                  <canvas ref={sourceCanvasRef} className="max-w-full h-auto block" />
                </div>
              </div>

              {/* Augmented Card */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Augmented (DocSim Output)
                </span>
                <div className="shadow-2xl rounded-lg border border-emerald-500/30 overflow-hidden bg-slate-900">
                  <canvas ref={outputCanvasRef} className="max-w-full h-auto block" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Augmentation Parameters Panel */}
        <div className="w-80 lg:w-96 border-l border-slate-800 bg-slate-950 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Augmentation Pipeline Controls
            </span>
          </div>

          {/* Gaussian Blur */}
          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-200">Gaussian Blur (sigma)</span>
              <span className="font-mono text-emerald-400">{blurAmount}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={blurAmount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setBlurAmount(val);
                updateConfigValue("gaussian_blur", "sigma_max", val);
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Additive Noise */}
          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-200">Additive Gaussian Noise</span>
              <span className="font-mono text-emerald-400">{noiseAmount}</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={noiseAmount}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setNoiseAmount(val);
                updateConfigValue("additive_gaussian_noise", "max_scale", val / 100);
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-200">Contrast Multiplier</span>
              <span className="font-mono text-emerald-400">{contrastGain.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={contrastGain}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setContrastGain(val);
                updateConfigValue("contrast", "max_gain", Math.round(val * 10));
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Brightness */}
          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-200">Brightness (Intensity)</span>
              <span className="font-mono text-emerald-400">{brightness.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={brightness}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setBrightness(val);
                updateConfigValue("intensity_multiplier", "max_multiplier", val);
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Perspective & Warping */}
          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-200">Perspective Tilt Angle</span>
              <span className="font-mono text-emerald-400">{perspectiveAngle}°</span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              step="1"
              value={perspectiveAngle}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setPerspectiveAngle(val);
                updateConfigValue("perspective_transform", "max_scale", Math.abs(val) / 100);
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Artifact Toggles */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-2.5">
            <span className="font-medium text-slate-200 block">Photocopy & Paper Artifacts</span>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">Paper Creases & Folds</span>
              <input
                type="checkbox"
                checked={paperFolds}
                onChange={(e) => {
                  setPaperFolds(e.target.checked);
                  updateConfigValue("creases_and_curls", "probability", e.target.checked ? 0.8 : 0);
                }}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">Grayscale / Black & White</span>
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => {
                  setGrayscale(e.target.checked);
                  updateConfigValue("grayscale", "probability", e.target.checked ? 1.0 : 0);
                }}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500"
              />
            </label>
          </div>

          {/* Config Raw Excerpt */}
          <div className="pt-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
              DocSim Config JSON Payload
            </span>
            <pre className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[10px] font-mono text-slate-400 overflow-x-auto max-h-40">
              {JSON.stringify(config?.augmentations || {}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
