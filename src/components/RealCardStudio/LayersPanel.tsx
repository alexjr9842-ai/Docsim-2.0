import React from "react";
import { CardLayerConfig } from "../../utils/cardData";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Image,
  QrCode,
  Barcode,
  Cpu,
  PenTool,
  RotateCcw,
  Sliders,
  Move,
} from "lucide-react";

interface LayersPanelProps {
  layers: CardLayerConfig[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<CardLayerConfig>) => void;
  onResetDefaultLayers: () => void;
  onResetPpSize?: () => void;
  isPpLocked?: boolean;
  onTogglePpLock?: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onUpdateLayer,
  onResetDefaultLayers,
  onResetPpSize,
  isPpLocked,
  onTogglePpLock,
}) => {
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  const getLayerIcon = (type: CardLayerConfig["type"]) => {
    switch (type) {
      case "text":
        return <Type className="w-3.5 h-3.5 text-blue-400" />;
      case "image":
        return <Image className="w-3.5 h-3.5 text-emerald-400" />;
      case "qr":
        return <QrCode className="w-3.5 h-3.5 text-purple-400" />;
      case "barcode":
        return <Barcode className="w-3.5 h-3.5 text-amber-400" />;
      case "signature":
        return <PenTool className="w-3.5 h-3.5 text-cyan-400" />;
      case "chip":
        return <Cpu className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return <Sliders className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-200">
      {/* Header */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Photoshop Layers
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            {layers.length}
          </span>
        </div>

        <button
          onClick={onResetDefaultLayers}
          title="Reset to Official Standard Coordinates"
          className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 hover:bg-slate-800/80 px-2 py-1 rounded transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Layer Stack */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
        {layers.map((layer) => {
          const isSelected = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? "bg-blue-600/20 border border-blue-500/40 text-white shadow-sm"
                  : "hover:bg-slate-800/60 text-slate-300 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className="p-1 hover:text-white transition-colors"
                  title={layer.visible ? "Hide Layer" : "Show Layer"}
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5 text-slate-300" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </button>

                {/* Layer Icon */}
                <span className="p-1 bg-slate-950/60 rounded border border-slate-800">
                  {getLayerIcon(layer.type)}
                </span>

                {/* Layer Name */}
                <span
                  className={`text-xs truncate font-medium ${
                    !layer.visible ? "line-through text-slate-500" : ""
                  }`}
                >
                  {layer.name}
                </span>
              </div>

              {/* Coordinates Quick Badge & Lock */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                  {layer.x.toFixed(0)}%, {layer.y.toFixed(0)}%
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { locked: !layer.locked });
                  }}
                  className="p-1 hover:text-white text-slate-500 transition-colors"
                  title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                >
                  {layer.locked ? (
                    <Lock className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Unlock className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Layer Precision Inspector */}
      {activeLayer && (
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Move className="w-3 h-3" />
              {activeLayer.name}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">{activeLayer.type} layer</span>
          </div>

          {/* Coordinate Sliders */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                <span>X Position</span>
                <span className="font-mono text-blue-300">{activeLayer.x.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="95"
                step="0.5"
                value={activeLayer.x}
                onChange={(e) => onUpdateLayer(activeLayer.id, { x: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                <span>Y Position</span>
                <span className="font-mono text-blue-300">{activeLayer.y.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="95"
                step="0.5"
                value={activeLayer.y}
                onChange={(e) => onUpdateLayer(activeLayer.id, { y: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Size (Width & Height) Sliders for PP Photo, QR, Signature, Box */}
          {(activeLayer.width !== undefined || activeLayer.type !== "text") && (
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/60">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Width</span>
                  <span className="font-mono text-emerald-300">{(activeLayer.width || 25).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="0.5"
                  value={activeLayer.width || 25}
                  onChange={(e) => onUpdateLayer(activeLayer.id, { width: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Height</span>
                  <span className="font-mono text-emerald-300">{(activeLayer.height || 25).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="80"
                  step="0.5"
                  value={activeLayer.height || 25}
                  onChange={(e) => onUpdateLayer(activeLayer.id, { height: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Specific Passport Photo (PP) Quick Controls */}
          {activeLayer.id === "photo" && (
            <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
              {onResetPpSize && (
                <button
                  onClick={onResetPpSize}
                  className="flex-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
                  title="Reset photo dimensions & coordinates to official government standards"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset Official PP</span>
                </button>
              )}
              {onTogglePpLock && (
                <button
                  onClick={onTogglePpLock}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors border flex items-center gap-1 ${
                    isPpLocked
                      ? "bg-amber-600/20 border-amber-500/40 text-amber-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                  title="Lock PP size and placement to prevent accidental moving"
                >
                  {isPpLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  <span>{isPpLocked ? "Locked" : "Lock PP"}</span>
                </button>
              )}
            </div>
          )}

          {/* Font Controls (for text layers) */}
          {activeLayer.type === "text" && (
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Font Size</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="10"
                      max="60"
                      value={activeLayer.fontSize || 22}
                      onChange={(e) =>
                        onUpdateLayer(activeLayer.id, { fontSize: parseInt(e.target.value) || 20 })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                    <span className="text-[10px] text-slate-500">px</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Ink Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={activeLayer.color || "#0f172a"}
                      onChange={(e) => onUpdateLayer(activeLayer.id, { color: e.target.value })}
                      className="w-7 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-400">
                      {activeLayer.color || "#0f172a"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Official Font</label>
                <select
                  value={activeLayer.fontFamily || "'Arial-Custom-Bold', Arial, sans-serif"}
                  onChange={(e) => onUpdateLayer(activeLayer.id, { fontFamily: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="'Arial-Custom-Bold', Arial, sans-serif">
                    Arial Official Bold (Standard)
                  </option>
                  <option value="'Halant-Bold', 'Noto Sans Devanagari', sans-serif">
                    Halant Devanagari Bold (Govt Hindi)
                  </option>
                  <option value="'Verdana-Custom-Bold', Verdana, sans-serif">
                    Verdana Bold (Driving License)
                  </option>
                  <option value="'Share Tech Mono', monospace">
                    OCR / High-Security Monospace
                  </option>
                  <option value="'Lemon-Tuesday', cursive">
                    Lemon Tuesday (Signatures)
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Opacity Control */}
          <div className="pt-1 border-t border-slate-800/80">
            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Layer Opacity</span>
              <span className="font-mono text-slate-300">
                {Math.round((activeLayer.opacity ?? 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={activeLayer.opacity ?? 1}
              onChange={(e) =>
                onUpdateLayer(activeLayer.id, { opacity: parseFloat(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
