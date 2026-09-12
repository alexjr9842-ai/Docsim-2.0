import React, { useRef, useEffect, useState, useCallback } from "react";
import { CardSectionData, CardLayerConfig } from "../../utils/cardData";
import {
  TableDesignKey,
  drawTabletopBackground,
  drawPvcLaminatedPouch,
  drawPvcGlossySheen,
} from "../../utils/tabletopRenderer";
import { getOfficialBackPresetLayers } from "../../utils/backsideData";

export interface CardCanvasExportMethods {
  exportCardOnly: () => Promise<string>;
  exportTabletop: (format?: "png" | "jpeg", side?: "front" | "back") => Promise<string>;
}

interface CardCanvasProps {
  cardData: CardSectionData;
  activeLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<CardLayerConfig>) => void;
  isPhotoshopMode: boolean;
  showGuides: boolean;
  lockPermanent: boolean;
  qrCodeUrl: string;
  zoom: number; // 0.5 to 2.0
  onExportReady?: (exportFn: () => Promise<string>) => void;
  onExportMethodsReady?: (methods: CardCanvasExportMethods) => void;
}

export const CardCanvas: React.FC<CardCanvasProps> = ({
  cardData,
  activeLayerId,
  onSelectLayer,
  onUpdateLayer,
  isPhotoshopMode,
  showGuides,
  lockPermanent,
  qrCodeUrl,
  zoom,
  onExportReady,
  onExportMethodsReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dragging and resizing state for Photoshop mode
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; layerX: number; layerY: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; startW: number; startH: number } | null>(null);
  const [isHoveringResizeHandle, setIsHoveringResizeHandle] = useState(false);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

  // Cached image assets
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const photoImageRef = useRef<HTMLImageElement | null>(null);
  const qrImageRef = useRef<HTMLImageElement | null>(null);
  const sigImageRef = useRef<HTMLImageElement | null>(null);
  const customTableImageRef = useRef<HTMLImageElement | null>(null);

  // Standard CR-80 card base dimensions (85.6mm x 53.98mm = ~1.586 ratio)
  const baseCardWidth = 1012;
  const baseCardHeight = 638;

  // Tabletop canvas resolution (1500 x 1000 exact pixel dimensions requested by user)
  const tabletopWidth = 1500;
  const tabletopHeight = 1000;

  // Card placement within the 1500x1000 tabletop canvas
  // Fitted with ~225px horizontal and ~169px vertical tabletop margins
  const tabletopCardW = 1050;
  const tabletopCardH = 662;
  const tabletopCardX = Math.round((tabletopWidth - tabletopCardW) / 2); // 225
  const tabletopCardY = Math.round((tabletopHeight - tabletopCardH) / 2); // 169

  const isTabletop = cardData.isTabletopMode ?? false;
  const isBackSide = cardData.activeSide === "back";

  // Active layers depending on Front or Back side
  const activeLayers: CardLayerConfig[] = isBackSide
    ? cardData.backLayers && cardData.backLayers.length > 0
      ? cardData.backLayers
      : getOfficialBackPresetLayers(cardData.cardType)
    : cardData.layers || [];

  // Load background image (front only if present)
  useEffect(() => {
    if (!isBackSide && cardData.backgroundPath) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        bgImageRef.current = img;
        drawCanvas();
      };
      img.onerror = () => {
        bgImageRef.current = null;
        drawCanvas();
      };
      img.src = cardData.backgroundPath;
    } else {
      bgImageRef.current = null;
      drawCanvas();
    }
  }, [cardData.backgroundPath, isBackSide]);

  // Load photo image
  useEffect(() => {
    if (cardData.photoUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        photoImageRef.current = img;
        drawCanvas();
      };
      img.onerror = () => {
        photoImageRef.current = null;
        drawCanvas();
      };
      img.src = cardData.photoUrl;
    } else {
      photoImageRef.current = null;
      drawCanvas();
    }
  }, [cardData.photoUrl]);

  // Load QR code image
  useEffect(() => {
    if (qrCodeUrl) {
      const img = new Image();
      img.onload = () => {
        qrImageRef.current = img;
        drawCanvas();
      };
      img.onerror = () => {
        qrImageRef.current = null;
        drawCanvas();
      };
      img.src = qrCodeUrl;
    } else {
      qrImageRef.current = null;
      drawCanvas();
    }
  }, [qrCodeUrl]);

  // Load signature image
  useEffect(() => {
    if (cardData.signatureUrl) {
      const img = new Image();
      img.onload = () => {
        sigImageRef.current = img;
        drawCanvas();
      };
      img.onerror = () => {
        sigImageRef.current = null;
        drawCanvas();
      };
      img.src = cardData.signatureUrl;
    } else {
      sigImageRef.current = null;
      drawCanvas();
    }
  }, [cardData.signatureUrl]);

  // Load custom tabletop image if provided
  useEffect(() => {
    if (cardData.tableDesign === "custom" && cardData.customTableUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        customTableImageRef.current = img;
        drawCanvas();
      };
      img.onerror = () => {
        customTableImageRef.current = null;
        drawCanvas();
      };
      img.src = cardData.customTableUrl;
    } else {
      customTableImageRef.current = null;
    }
  }, [cardData.tableDesign, cardData.customTableUrl]);

  // Helper: Renders Card Face (Front or Back) into the provided bounding rect (x, y, w, h)
  const renderCardFace = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cardX: number,
      cardY: number,
      cardW: number,
      cardH: number,
      scale: number = 1.0,
      overrideSide?: "front" | "back"
    ) => {
      const side = overrideSide || cardData.activeSide || "front";
      const layersToDraw =
        side === "back"
          ? cardData.backLayers && cardData.backLayers.length > 0
            ? cardData.backLayers
            : getOfficialBackPresetLayers(cardData.cardType)
          : cardData.layers || [];

      ctx.save();
      ctx.translate(cardX, cardY);

      // Card rounded clip path (corner radius ~28px scaled)
      const r = 28 * scale;
      ctx.beginPath();
      ctx.roundRect(0, 0, cardW, cardH, r);
      ctx.clip();

      // 1. Draw Background
      if (side === "back") {
        renderBacksideBackground(ctx, cardW, cardH, cardData, scale);
      } else if (bgImageRef.current && bgImageRef.current.complete && bgImageRef.current.naturalWidth > 0) {
        ctx.drawImage(bgImageRef.current, 0, 0, cardW, cardH);
      } else {
        renderSyntheticBackground(ctx, cardW, cardH, cardData, scale);
      }

      // 2. Render Security Hologram / Guilloche if enabled on front
      if (side === "front" && cardData.hasGuilloche && !bgImageRef.current) {
        drawSecurityGuilloche(ctx, cardW, cardH, scale);
      }

      // 3. Render Each Active Dynamic Layer
      layersToDraw.forEach((layer) => {
        if (!layer.visible) return;

        ctx.save();
        ctx.globalAlpha = layer.opacity ?? 1.0;

        const lx = (layer.x / 100) * cardW;
        const ly = (layer.y / 100) * cardH;
        const lw = layer.width ? (layer.width / 100) * cardW : 100 * scale;
        const lh = layer.height ? (layer.height / 100) * cardH : 100 * scale;

        if (layer.type === "image") {
          // Passport Photo / Selfie Layer
          if (photoImageRef.current && photoImageRef.current.complete && photoImageRef.current.naturalWidth > 0) {
            drawPassportPhoto(
              ctx,
              photoImageRef.current,
              lx,
              ly,
              lw,
              lh,
              cardData,
              scale
            );
          } else {
            // Placeholder frame
            ctx.fillStyle = "#e2e8f0";
            ctx.fillRect(lx, ly, lw, lh);
            ctx.fillStyle = "#64748b";
            ctx.font = `${14 * scale}px Arial, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText("PORTRAIT", lx + lw / 2, ly + lh / 2);
          }
        } else if (layer.type === "qr") {
          // Dynamic QR Code
          if (qrImageRef.current && qrImageRef.current.complete) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(lx - 3 * scale, ly - 3 * scale, lw + 6 * scale, lh + 6 * scale);
            ctx.drawImage(qrImageRef.current, lx, ly, lw, lh);
          }
        } else if (layer.type === "signature") {
          // Handwritten Signature
          if (sigImageRef.current && sigImageRef.current.complete) {
            ctx.drawImage(sigImageRef.current, lx, ly, lw, lh);
          } else {
            ctx.font = `${28 * scale}px 'Lemon-Tuesday', cursive, sans-serif`;
            ctx.fillStyle = cardData.signatureColor || "#1e40af";
            ctx.textAlign = "center";
            ctx.fillText(cardData.nameEn || "Authorized Signature", lx + lw / 2, ly + lh * 0.7);
          }
        } else if (layer.type === "barcode") {
          // Barcode representation
          const codeText = side === "back" && cardData.backBarcodePayload
            ? cardData.backBarcodePayload
            : cardData.idNumber;
          drawBarcode(ctx, lx, ly, lw, lh, codeText, scale);
        } else if (layer.type === "chip") {
          // Gold EMV Smart Chip
          drawEmvChip(ctx, lx, ly, lw, lh, scale);
        } else if (layer.type === "text") {
          // Dynamic Text Layer
          let text = "";
          if (layer.dataKey && (cardData as any)[layer.dataKey]) {
            text = String((cardData as any)[layer.dataKey]);
          } else {
            text = layer.name;
          }

          if (layer.prefix) text = `${layer.prefix}${text}`;
          if (layer.uppercase) text = text.toUpperCase();

          const fSize = (layer.fontSize || 22) * scale;
          const fFam = layer.fontFamily || "'Arial-Custom-Bold', Arial, sans-serif";
          ctx.font = `bold ${fSize}px ${fFam}`;
          ctx.fillStyle = layer.color || "#0f172a";
          ctx.textAlign = layer.textAlign || "left";
          ctx.textBaseline = "middle";

          if (layer.letterSpacing && "letterSpacing" in ctx) {
            (ctx as any).letterSpacing = layer.letterSpacing;
          }

          ctx.fillText(text, lx, ly);

          if ("letterSpacing" in ctx) {
            (ctx as any).letterSpacing = "0px";
          }
        }

        ctx.restore();
      });

      // 4. Physical Finish Sheen (Matte / Glossy)
      if (cardData.finish === "glossy" && cardData.plasticSheen > 0) {
        const sheenGrad = ctx.createLinearGradient(0, 0, cardW, cardH);
        const intensity = (cardData.plasticSheen / 100) * 0.15;
        sheenGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity * 1.5})`);
        sheenGrad.addColorStop(0.35, "rgba(255, 255, 255, 0)");
        sheenGrad.addColorStop(0.7, `rgba(255, 255, 255, ${intensity})`);
        sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(0, 0, cardW, cardH);
      }

      ctx.restore();
    },
    [cardData]
  );

  // Main Canvas Rendering Engine
  const drawCanvas = useCallback(
    (targetCanvas?: HTMLCanvasElement, exportScale: number = 1) => {
      const canvas = targetCanvas || canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const isTabletopView = cardData.isTabletopMode ?? false;

      if (isTabletopView) {
        // Tabletop Mode: 1500 x 1000 canvas with Table background + Laminated PVC Pouch + Card
        const w = tabletopWidth * exportScale;
        const h = tabletopHeight * exportScale;
        canvas.width = w;
        canvas.height = h;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        // 1. Draw Tabletop Surface (Walnut, Oak, Marble, Slate, Cutting Mat, etc.)
        drawTabletopBackground(
          ctx,
          w,
          h,
          cardData.tableDesign || "walnut",
          customTableImageRef.current
        );

        // 2. Card placement on the tabletop
        const cX = tabletopCardX * exportScale;
        const cY = tabletopCardY * exportScale;
        const cW = tabletopCardW * exportScale;
        const cH = tabletopCardH * exportScale;

        // 3. Draw Laminated PVC Pouch with heat-sealed crimp edge and drop shadows
        drawPvcLaminatedPouch(ctx, cX, cY, cW, cH, exportScale, {
          margin: cardData.pvcPouchMargin ?? 26,
          sheen: cardData.pvcPouchSheen ?? 65,
          showPouch: cardData.showPvcPouch !== false,
        });

        // 4. Render the Card Face
        renderCardFace(ctx, cX, cY, cW, cH, exportScale);

        // 5. Draw Specular Gloss & Plastic Sheen over the PVC sleeve
        drawPvcGlossySheen(ctx, cX, cY, cW, cH, exportScale, {
          margin: cardData.pvcPouchMargin ?? 26,
          sheen: cardData.pvcPouchSheen ?? 65,
          showPouch: cardData.showPvcPouch !== false,
        });

        // 6. Photoshop Mode Overlays (Bounding Boxes & Guides)
        if (isPhotoshopMode && !targetCanvas) {
          ctx.save();
          ctx.translate(cX, cY);

          if (showGuides) {
            drawSafeGuides(ctx, cW, cH, exportScale);
          }

          const selectedLayer = activeLayers.find((l) => l.id === activeLayerId);
          if (selectedLayer && selectedLayer.visible) {
            drawBoundingBox(ctx, selectedLayer, cW, cH, true, exportScale);
          }

          if (hoveredLayerId && hoveredLayerId !== activeLayerId) {
            const hovered = activeLayers.find((l) => l.id === hoveredLayerId);
            if (hovered && hovered.visible) {
              drawBoundingBox(ctx, hovered, cW, cH, false, exportScale);
            }
          }

          ctx.restore();
        }

        ctx.restore();
      } else {
        // Flat Card Only Mode: Base CR-80 canvas (1012 x 638)
        const w = baseCardWidth * exportScale;
        const h = baseCardHeight * exportScale;
        canvas.width = w;
        canvas.height = h;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        // Render card directly at (0, 0)
        renderCardFace(ctx, 0, 0, w, h, exportScale);

        // Photoshop Mode Overlays
        if (isPhotoshopMode && !targetCanvas) {
          if (showGuides) {
            drawSafeGuides(ctx, w, h, exportScale);
          }

          const selectedLayer = activeLayers.find((l) => l.id === activeLayerId);
          if (selectedLayer && selectedLayer.visible) {
            drawBoundingBox(ctx, selectedLayer, w, h, true, exportScale);
          }

          if (hoveredLayerId && hoveredLayerId !== activeLayerId) {
            const hovered = activeLayers.find((l) => l.id === hoveredLayerId);
            if (hovered && hovered.visible) {
              drawBoundingBox(ctx, hovered, w, h, false, exportScale);
            }
          }
        }

        ctx.restore();
      }
    },
    [
      cardData,
      activeLayerId,
      hoveredLayerId,
      isPhotoshopMode,
      showGuides,
      lockPermanent,
      renderCardFace,
      activeLayers,
    ]
  );

  // Redraw when cardData or active properties change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Export 300 DPI flat card method
  const exportHighResImage = useCallback(async (): Promise<string> => {
    if (document.fonts) {
      await document.fonts.ready;
    }
    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return "";

    exportCanvas.width = baseCardWidth * 2;
    exportCanvas.height = baseCardHeight * 2;
    renderCardFace(exportCtx, 0, 0, exportCanvas.width, exportCanvas.height, 2.0);
    return exportCanvas.toDataURL("image/png", 1.0);
  }, [renderCardFace]);

  // Export 1500 x 1000 Tabletop Mockup with PVC layer (Strictly 1500x1000 pixel size)
  const exportTabletop1500x1000 = useCallback(
    async (format: "png" | "jpeg" = "png", side?: "front" | "back"): Promise<string> => {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = tabletopWidth;
      exportCanvas.height = tabletopHeight;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return "";

      // 1. Draw Tabletop Background across the 1500x1000 surface
      drawTabletopBackground(
        ctx,
        tabletopWidth,
        tabletopHeight,
        cardData.tableDesign || "walnut",
        customTableImageRef.current
      );

      // 2. Card placement
      const cX = tabletopCardX;
      const cY = tabletopCardY;
      const cW = tabletopCardW;
      const cH = tabletopCardH;

      // 3. Draw Laminated PVC Pouch with heat seal and soft contact shadows
      drawPvcLaminatedPouch(ctx, cX, cY, cW, cH, 1.0, {
        margin: cardData.pvcPouchMargin ?? 26,
        sheen: cardData.pvcPouchSheen ?? 65,
        showPouch: cardData.showPvcPouch !== false,
      });

      // 4. Render Card Face
      renderCardFace(ctx, cX, cY, cW, cH, 1.0, side || cardData.activeSide);

      // 5. Specular Plastic Sheen Reflection
      drawPvcGlossySheen(ctx, cX, cY, cW, cH, 1.0, {
        margin: cardData.pvcPouchMargin ?? 26,
        sheen: cardData.pvcPouchSheen ?? 65,
        showPouch: cardData.showPvcPouch !== false,
      });

      const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
      return exportCanvas.toDataURL(mimeType, format === "jpeg" ? 0.96 : 1.0);
    },
    [cardData, renderCardFace]
  );

  useEffect(() => {
    if (onExportReady) {
      onExportReady(exportHighResImage);
    }
    if (onExportMethodsReady) {
      onExportMethodsReady({
        exportCardOnly: exportHighResImage,
        exportTabletop: exportTabletop1500x1000,
      });
    }
  }, [onExportReady, onExportMethodsReady, exportHighResImage, exportTabletop1500x1000]);

  // Mouse / Pointer Hit Testing for Photoshop Mode (handles both flat and tabletop mode)
  const getPointerPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pxX: 0, pxY: 0, onCard: false };
    const rect = canvas.getBoundingClientRect();

    if (isTabletop) {
      const pxX = ((e.clientX - rect.left) / rect.width) * tabletopWidth;
      const pxY = ((e.clientY - rect.top) / rect.height) * tabletopHeight;

      // Card relative bounds
      const cX = tabletopCardX;
      const cY = tabletopCardY;
      const cW = tabletopCardW;
      const cH = tabletopCardH;

      const onCard = pxX >= cX && pxX <= cX + cW && pxY >= cY && pxY <= cY + cH;
      const localPctX = ((pxX - cX) / cW) * 100;
      const localPctY = ((pxY - cY) / cH) * 100;

      return { x: localPctX, y: localPctY, pxX, pxY, onCard };
    } else {
      const pxX = ((e.clientX - rect.left) / rect.width) * baseCardWidth;
      const pxY = ((e.clientY - rect.top) / rect.height) * baseCardHeight;
      const pctX = (pxX / baseCardWidth) * 100;
      const pctY = (pxY / baseCardHeight) * 100;
      return { x: pctX, y: pctY, pxX, pxY, onCard: true };
    }
  };

  const hitTestLayer = (pctX: number, pctY: number): CardLayerConfig | null => {
    const layers = activeLayers;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible || layer.locked) continue;

      const lx = layer.x;
      const ly = layer.y;
      const lw = layer.width || 25;
      const lh = layer.height || 6;

      if (layer.type === "text") {
        const textH = 7;
        const textW = layer.width || 35;
        if (pctX >= lx - 2 && pctX <= lx + textW && pctY >= ly - textH / 2 && pctY <= ly + textH / 2) {
          return layer;
        }
      } else {
        if (pctX >= lx && pctX <= lx + lw && pctY >= ly && pctY <= ly + lh) {
          return layer;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPhotoshopMode) return;
    const { x, y, onCard } = getPointerPos(e);
    if (isTabletop && !onCard) {
      onSelectLayer(null);
      return;
    }

    const activeLayer = activeLayers.find((l) => l.id === activeLayerId);
    if (activeLayer && !activeLayer.locked && !(cardData.lockPpPlacement && activeLayer.id === "photo")) {
      const lw = activeLayer.width || 25;
      const lh = activeLayer.height || (activeLayer.type === "text" ? 7 : 10);
      const cornerX = activeLayer.x + lw;
      const cornerY = activeLayer.type === "text" ? activeLayer.y + lh / 2 : activeLayer.y + lh;
      const dist = Math.hypot(x - cornerX, y - cornerY);
      if (dist < 4.5) {
        setIsResizing(true);
        setResizeStart({ x, y, startW: lw, startH: lh });
        return;
      }
    }

    const hit = hitTestLayer(x, y);
    if (hit) {
      onSelectLayer(hit.id);
      if (!hit.locked && !(cardData.lockPpPlacement && hit.id === "photo")) {
        setIsDragging(true);
        setDragStart({ x, y, layerX: hit.x, layerY: hit.y });
      }
    } else {
      onSelectLayer(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPhotoshopMode) return;
    const { x, y, onCard } = getPointerPos(e);

    if (isResizing && resizeStart && activeLayerId) {
      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      const newW = Math.max(5, Math.min(85, parseFloat((resizeStart.startW + deltaX).toFixed(1))));
      const newH = Math.max(4, Math.min(85, parseFloat((resizeStart.startH + deltaY).toFixed(1))));
      onUpdateLayer(activeLayerId, { width: newW, height: newH });
      return;
    }

    if (isDragging && dragStart && activeLayerId) {
      const activeLayer = activeLayers.find((l) => l.id === activeLayerId);
      if (activeLayer?.locked || (cardData.lockPpPlacement && activeLayer?.id === "photo")) return;
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      const newX = Math.max(0, Math.min(95, parseFloat((dragStart.layerX + deltaX).toFixed(1))));
      const newY = Math.max(0, Math.min(95, parseFloat((dragStart.layerY + deltaY).toFixed(1))));
      onUpdateLayer(activeLayerId, { x: newX, y: newY });
    } else {
      if (isTabletop && !onCard) {
        setIsHoveringResizeHandle(false);
        setHoveredLayerId(null);
        return;
      }

      const activeLayer = activeLayers.find((l) => l.id === activeLayerId);
      if (activeLayer && !activeLayer.locked && !(cardData.lockPpPlacement && activeLayer.id === "photo")) {
        const lw = activeLayer.width || 25;
        const lh = activeLayer.height || (activeLayer.type === "text" ? 7 : 10);
        const cornerX = activeLayer.x + lw;
        const cornerY = activeLayer.type === "text" ? activeLayer.y + lh / 2 : activeLayer.y + lh;
        if (Math.hypot(x - cornerX, y - cornerY) < 4.5) {
          setIsHoveringResizeHandle(true);
          return;
        }
      }
      setIsHoveringResizeHandle(false);
      const hit = hitTestLayer(x, y);
      setHoveredLayerId(hit ? hit.id : null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setIsResizing(false);
    setResizeStart(null);
  };

  // Keyboard Nudge Support in Photoshop Mode
  useEffect(() => {
    if (!isPhotoshopMode || !activeLayerId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeLayer = activeLayers.find((l) => l.id === activeLayerId);
      if (!activeLayer || activeLayer.locked) return;

      const step = e.shiftKey ? 2.0 : e.altKey ? 0.2 : 0.5;
      let dx = 0;
      let dy = 0;

      if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;
      else return;

      e.preventDefault();
      const newX = Math.max(0, Math.min(95, parseFloat((activeLayer.x + dx).toFixed(1))));
      const newY = Math.max(0, Math.min(95, parseFloat((activeLayer.y + dy).toFixed(1))));
      onUpdateLayer(activeLayerId, { x: newX, y: newY });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPhotoshopMode, activeLayerId, activeLayers, onUpdateLayer]);

  const activeLayer = activeLayers.find((l) => l.id === activeLayerId);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center p-3 select-none w-full"
    >
      {/* Active Layer Float Badge in Photoshop Mode */}
      {isPhotoshopMode && activeLayer && (
        <div className="absolute top-1 z-20 flex items-center gap-2.5 bg-slate-900/95 text-white text-xs px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-xl border border-slate-700 font-mono animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="font-semibold text-blue-300">{activeLayer.name}</span>
          <span className="text-slate-500">|</span>
          <span>X: {activeLayer.x.toFixed(1)}%</span>
          <span>Y: {activeLayer.y.toFixed(1)}%</span>
          {activeLayer.fontSize && <span>Size: {activeLayer.fontSize}px</span>}
          <span className="text-slate-500 text-[10px] hidden sm:inline">(Arrow keys to nudge)</span>
        </div>
      )}

      {/* Main Responsive Canvas Container */}
      <div
        className="relative transition-transform duration-150 ease-out shadow-2xl rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950"
        style={{
          width: isTabletop
            ? `${Math.min(tabletopWidth * zoom * 0.58, 860)}px`
            : `${Math.min(baseCardWidth * zoom, 740)}px`,
          aspectRatio: isTabletop ? "1500 / 1000" : "1012 / 638",
          cursor: isPhotoshopMode
            ? isResizing || isHoveringResizeHandle
              ? "nwse-resize"
              : isDragging
              ? "grabbing"
              : "grab"
            : "default",
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};

// ============================================================================
// HELPER DRAWING FUNCTIONS
// ============================================================================

/**
 * High-fidelity Passport Photo (PP Size) Rendering Engine.
 * Features:
 * - Smart object-fit cover crop (prevents squishing or stretching of selfie)
 * - User face zoom & pan offsets (X/Y)
 * - Studio background replacement/tint (Studio White, Govt Light Blue, Neutral Grey)
 * - Authentic physical ID print contrast, brightness, and tone matrix
 * - Brightness (30% - 200%) & Opacity (10% - 100%) controls
 * - Standard crisp passport border
 */
function drawPassportPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  lx: number,
  ly: number,
  lw: number,
  lh: number,
  cardData: CardSectionData,
  exportScale: number
) {
  ctx.save();

  // 1. Passport Outer Border Frame
  const borderWidth = (cardData.passportBorderWidth ?? 2) * exportScale;
  const borderColor = cardData.passportBorderColor || "#ffffff";
  if (cardData.hasPassportBorder !== false) {
    ctx.fillStyle = borderColor;
    ctx.fillRect(lx - borderWidth, ly - borderWidth, lw + borderWidth * 2, lh + borderWidth * 2);
    ctx.strokeStyle = "rgba(15, 23, 42, 0.25)";
    ctx.lineWidth = 1 * exportScale;
    ctx.strokeRect(lx - borderWidth, ly - borderWidth, lw + borderWidth * 2, lh + borderWidth * 2);
  }

  // 2. Strict Frame Clipping (Selfie won't overflow the photo area)
  ctx.beginPath();
  ctx.rect(lx, ly, lw, lh);
  ctx.clip();

  // Apply user-adjusted opacity
  const opacity = cardData.photoOpacity !== undefined ? cardData.photoOpacity : 1.0;
  ctx.globalAlpha = Math.max(0.05, Math.min(1.0, opacity));

  // 3. Studio Backdrop Fill
  if (cardData.photoBackdrop === "studio-blue") {
    const bgGrad = ctx.createLinearGradient(lx, ly, lx, ly + lh);
    bgGrad.addColorStop(0, "#dbeafe");
    bgGrad.addColorStop(1, "#93c5fd");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(lx, ly, lw, lh);
  } else if (cardData.photoBackdrop === "studio-grey") {
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(lx, ly, lw, lh);
  } else if (cardData.photoBackdrop === "studio-white") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(lx, ly, lw, lh);
  }

  // 4. Color Filters & Physical Polycarbonate Print Tone + Brightness
  const brightness = cardData.photoBrightness ?? 1.0;
  const contrast = cardData.photoContrast ?? 1.0;
  let filterStr = `brightness(${brightness}) contrast(${contrast})`;

  if (cardData.photoFilter === "grayscale") {
    filterStr += " grayscale(100%) contrast(120%)";
  } else if (cardData.photoFilter === "govt-id") {
    filterStr += " saturate(92%) contrast(118%)";
  } else if (cardData.photoFilter === "high-contrast") {
    filterStr += " contrast(135%) brightness(95%)";
  } else if (cardData.photoFilter === "warm") {
    filterStr += " sepia(15%) saturate(110%)";
  }

  ctx.filter = filterStr;

  // 5. Intelligent Aspect-Ratio Fit (Cover Mode) + User Face Zoom & Pan
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  const baseScale = Math.max(lw / imgW, lh / imgH);
  const userScale = cardData.photoScale ?? 1.0;
  const finalScale = baseScale * userScale;

  const renderW = imgW * finalScale;
  const renderH = imgH * finalScale;

  const userOffX = ((cardData.photoOffsetX ?? 0) / 100) * lw;
  const userOffY = ((cardData.photoOffsetY ?? 0) / 100) * lh;

  const renderX = lx + (lw - renderW) / 2 + userOffX;
  const renderY = ly + (lh - renderH) / 2 + userOffY;

  ctx.drawImage(img, renderX, renderY, renderW, renderH);

  // 6. Subtle studio edge blend if custom backdrop is active
  if (cardData.photoBackdrop && cardData.photoBackdrop !== "none") {
    ctx.filter = "none";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5 * exportScale;
    ctx.strokeRect(lx, ly, lw, lh);
  }

  ctx.restore();
}

/**
 * Procedural Backside Background Generator
 * Authentic legal reverse patterns for PAN, Aadhaar, Driving License, Voter ID, and Institutional IDs.
 */
function renderBacksideBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  card: CardSectionData,
  scale: number
) {
  ctx.save();

  if (card.cardType.includes("pan")) {
    // Official Income Tax Department Reverse
    // Warm off-white card stock
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#f8fafc");
    bgGrad.addColorStop(0.5, "#f1f5f9");
    bgGrad.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle microline security waves
    ctx.strokeStyle = "rgba(30, 58, 138, 0.05)";
    ctx.lineWidth = 1 * scale;
    for (let i = 0; i < 28; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i / 28) * h);
      ctx.bezierCurveTo(w * 0.3, (i / 28) * h + 20 * scale, w * 0.7, (i / 28) * h - 20 * scale, w, (i / 28) * h);
      ctx.stroke();
    }

    // Top Navy Header Stripe
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(0, 0, w, 6 * scale);

    // Return Address Box at bottom
    ctx.fillStyle = "rgba(241, 245, 249, 0.9)";
    ctx.fillRect(15 * scale, h - 55 * scale, w - 30 * scale, 45 * scale);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(15 * scale, h - 55 * scale, w - 30 * scale, 45 * scale);

    // Helpdesk footer line
    ctx.fillStyle = "#047857";
    ctx.fillRect(0, h - 5 * scale, w, 5 * scale);
  } else if (card.cardType.includes("aadhaar")) {
    // UIDAI Official Address Reverse
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#ffffff");
    bgGrad.addColorStop(0.5, "#fffbf5");
    bgGrad.addColorStop(1, "#fef3c7");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // UIDAI Saffron Top Accent
    ctx.fillStyle = "#ea580c";
    ctx.fillRect(0, 0, w, 5 * scale);

    // Security guilloche waves
    ctx.strokeStyle = "rgba(234, 88, 12, 0.06)";
    ctx.lineWidth = 1 * scale;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i / 20) * h);
      ctx.quadraticCurveTo(w / 2, (i / 20) * h + 25 * scale, w, (i / 20) * h);
      ctx.stroke();
    }

    // Bottom Green Accent
    ctx.fillStyle = "#15803d";
    ctx.fillRect(0, h - 5 * scale, w, 5 * scale);
  } else if (card.cardType === "driving-license") {
    // Smart Card Driving License Reverse
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // Golden chip contacts track pattern
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, w, h);

    // Vehicle Class Table Box
    const tableX = 35 * scale;
    const tableY = 60 * scale;
    const tableW = w - 70 * scale;
    const tableH = 150 * scale;

    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(tableX, tableY, tableW, 28 * scale);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(tableX, tableY, tableW, tableH);
  } else if (card.cardType === "voter-id") {
    // Election Commission Reverse
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, w, h);

    // ECI Ashoka watermark
    ctx.strokeStyle = "rgba(30, 58, 138, 0.06)";
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 90 * scale, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Institutional / Campus / Corporate / Loyalty Reverse
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // Standard High-Coercivity Magnetic Stripe (12.7mm height)
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, w, 75 * scale);

    // Glossy stripe specular highlight
    const magGrad = ctx.createLinearGradient(0, 0, w, 75 * scale);
    magGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    magGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.0)");
    magGrad.addColorStop(1, "rgba(255, 255, 255, 0.04)");
    ctx.fillStyle = magGrad;
    ctx.fillRect(0, 0, w, 75 * scale);

    // Signature strip box
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(w * 0.58, h * 0.58, w * 0.38, 70 * scale);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(w * 0.58, h * 0.58, w * 0.38, 70 * scale);
  }

  ctx.restore();
}

/**
 * Synthetic Front Background Generator
 */
function renderSyntheticBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  card: CardSectionData,
  scale: number
) {
  ctx.save();

  if (card.cardType === "student-card") {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#f1f5f9");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Crimson Top Banner
    const topGrad = ctx.createLinearGradient(0, 0, w, 0);
    topGrad.addColorStop(0, "#991b1b");
    topGrad.addColorStop(1, "#b91c1c");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, 115 * scale);

    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(0, 115 * scale, w, 4 * scale);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, h - 35 * scale, w, 35 * scale);
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${11 * scale}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("STUDENT IDENTITY CARD • NON-TRANSFERABLE • VALID FOR ACADEMIC YEAR", w / 2, h - 14 * scale);
  } else if (card.cardType === "employee-card") {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#f8fafc");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const topGrad = ctx.createLinearGradient(0, 0, w, 0);
    topGrad.addColorStop(0, "#0f172a");
    topGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, 115 * scale);

    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, 115 * scale, w, 4 * scale);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, h - 35 * scale, w, 35 * scale);
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${11 * scale}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("FACILITY ACCESS • PROPERTY OF APEX TECHNOLOGIES • IF FOUND RETURN TO SECURITY", w / 2, h - 14 * scale);
  } else if (card.cardType === "loyalty-card") {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#090d16");
    grad.addColorStop(0.5, "#131b2e");
    grad.addColorStop(1, "#0a0d14");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(w * 0.7, 0);
    ctx.lineTo(w, h * 0.6);
    ctx.stroke();

    drawEmvChip(ctx, w * 0.06, h * 0.25, 65 * scale, 50 * scale, scale);
  } else if (card.cardType === "library-card") {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#fafaf9");
    grad.addColorStop(1, "#f5f5f4");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const topGrad = ctx.createLinearGradient(0, 0, w, 0);
    topGrad.addColorStop(0, "#881337");
    topGrad.addColorStop(1, "#9f1239");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, 115 * scale);

    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(0, 115 * scale, w, 4 * scale);
  } else {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#f8fafc");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}

/**
 * Security Guilloche Waves
 */
function drawSecurityGuilloche(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(59, 130, 246, 0.08)";
  ctx.lineWidth = 1.2 * scale;
  const numWaves = 14;
  for (let i = 0; i < numWaves; i++) {
    ctx.beginPath();
    const yOffset = (i / numWaves) * h;
    for (let x = 0; x <= w; x += 15) {
      const y = yOffset + Math.sin((x / w) * Math.PI * 4 + i) * 18 * scale;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Code-128 High-Density Barcode Generator
 */
function drawBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  scale: number
) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 3 * scale, y - 3 * scale, w + 6 * scale, h + 18 * scale);

  ctx.fillStyle = "#0f172a";
  const numBars = 45;
  const barW = w / (numBars * 1.6);
  let curX = x;

  for (let i = 0; i < numBars; i++) {
    const isThick = (i * 7 + (text.charCodeAt(i % text.length) || 0)) % 3 === 0;
    const bw = isThick ? barW * 2 : barW;
    ctx.fillRect(curX, y, bw, h);
    curX += bw + barW * 0.8;
    if (curX > x + w) break;
  }

  ctx.font = `${10 * scale}px 'Share Tech Mono', monospace`;
  ctx.textAlign = "center";
  ctx.fillText(text, x + w / 2, y + h + 10 * scale);
  ctx.restore();
}

/**
 * Gold EMV Smart Chip
 */
function drawEmvChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
) {
  ctx.save();
  const goldGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  goldGrad.addColorStop(0, "#fde68a");
  goldGrad.addColorStop(0.3, "#f59e0b");
  goldGrad.addColorStop(0.7, "#d97706");
  goldGrad.addColorStop(1, "#fef3c7");

  const r = 6 * scale;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = goldGrad;
  ctx.fill();
  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y);
  ctx.lineTo(x + w * 0.35, y + h);
  ctx.moveTo(x + w * 0.65, y);
  ctx.lineTo(x + w * 0.65, y + h);
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x + w, y + h * 0.5);
  ctx.stroke();
  ctx.restore();
}

/**
 * Photoshop Selection Bounding Box & Handles
 */
function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  layer: CardLayerConfig,
  w: number,
  h: number,
  isActive: boolean,
  scale: number
) {
  ctx.save();
  const lx = (layer.x / 100) * w;
  const ly = (layer.y / 100) * h;
  const lw = layer.width ? (layer.width / 100) * w : 180 * scale;
  const lh = layer.height ? (layer.height / 100) * h : 32 * scale;

  let boxX = lx;
  let boxY = ly;
  let boxW = lw;
  let boxH = lh;

  if (layer.type === "text") {
    boxY = ly - lh / 2;
    boxH = lh;
  }

  ctx.strokeStyle = isActive ? "#3b82f6" : "#60a5fa";
  ctx.lineWidth = (isActive ? 2 : 1) * scale;
  ctx.setLineDash(isActive ? [4 * scale, 3 * scale] : [2 * scale, 2 * scale]);
  ctx.strokeRect(boxX - 3 * scale, boxY - 3 * scale, boxW + 6 * scale, boxH + 6 * scale);

  if (isActive) {
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#1d4ed8";
    ctx.lineWidth = 1.5 * scale;
    const handleSize = 6 * scale;
    const corners = [
      [boxX - 3 * scale, boxY - 3 * scale],
      [boxX + boxW + 3 * scale, boxY - 3 * scale],
      [boxX - 3 * scale, boxY + boxH + 3 * scale],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    });

    const brX = boxX + boxW + 3 * scale;
    const brY = boxY + boxH + 3 * scale;
    const brSize = 8 * scale;
    ctx.fillStyle = "#2563eb";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2 * scale;
    ctx.fillRect(brX - brSize / 2, brY - brSize / 2, brSize, brSize);
    ctx.strokeRect(brX - brSize / 2, brY - brSize / 2, brSize, brSize);
  }
  ctx.restore();
}

/**
 * Print Bleed & Alignment Guides
 */
function drawSafeGuides(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
  ctx.lineWidth = 1 * scale;
  ctx.setLineDash([3 * scale, 3 * scale]);

  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);

  const margin = 35 * scale;
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);
  ctx.stroke();
  ctx.restore();
}
