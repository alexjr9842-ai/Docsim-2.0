/**
 * Tabletop Photorealistic Mockup & PVC Lamination Pouch Rendering Engine
 * Accurately simulates physical cards placed on various luxury and workshop table surfaces
 * with clear heat-sealed PVC lamination pouches, realistic contact shadows, and specular highlights.
 */

export type TableDesignKey =
  | "walnut"
  | "oak"
  | "marble"
  | "slate"
  | "cutting-mat"
  | "leather"
  | "studio"
  | "custom";

export interface TableDesignOption {
  key: TableDesignKey;
  name: string;
  category: "Wood" | "Stone" | "Studio & Craft" | "Custom";
  description: string;
  previewColor: string;
}

export const TABLE_DESIGNS: TableDesignOption[] = [
  {
    key: "walnut",
    name: "Dark Walnut Wood",
    category: "Wood",
    description: "Deep organic walnut timber grain with satin polish & warm grain ripples (as seen in official photo)",
    previewColor: "#2a150d",
  },
  {
    key: "oak",
    name: "Golden Honey Oak",
    category: "Wood",
    description: "Fine natural oak wood grain with warm amber tones and natural pores",
    previewColor: "#7c4a1e",
  },
  {
    key: "marble",
    name: "Carrara White Marble",
    category: "Stone",
    description: "Luxurious Italian white marble slab with soft grey diagonal mineral veining",
    previewColor: "#f1f5f9",
  },
  {
    key: "slate",
    name: "Charcoal Slate / Granite",
    category: "Stone",
    description: "Textured matte black slate stone with architectural cleavage marks",
    previewColor: "#1a1d24",
  },
  {
    key: "cutting-mat",
    name: "Craft Cutting Mat",
    category: "Studio & Craft",
    description: "Self-healing forest green workshop mat with precision grid rules & angle guides",
    previewColor: "#14532d",
  },
  {
    key: "leather",
    name: "Executive Leather Blotter",
    category: "Studio & Craft",
    description: "Rich saddle brown calfskin desk pad with perimeter saddle stitch detailing",
    previewColor: "#3a1c10",
  },
  {
    key: "studio",
    name: "Studio Neutral Grey",
    category: "Studio & Craft",
    description: "Clean minimalist photographic surface with soft radial studio vignette",
    previewColor: "#64748b",
  },
];

/**
 * Draws high-fidelity procedural tabletop surface directly onto canvas context
 */
export function drawTabletopBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  design: TableDesignKey,
  customImage?: HTMLImageElement | null
) {
  ctx.save();

  if (design === "custom" && customImage) {
    // Custom uploaded user background image
    const imgW = customImage.naturalWidth || customImage.width;
    const imgH = customImage.naturalHeight || customImage.height;
    const scale = Math.max(w / imgW, h / imgH);
    const rw = imgW * scale;
    const rh = imgH * scale;
    const rx = (w - rw) / 2;
    const ry = (h - rh) / 2;
    ctx.drawImage(customImage, rx, ry, rw, rh);
    ctx.restore();
    return;
  }

  switch (design) {
    case "walnut": {
      // 1. Base rich walnut wood gradient
      const baseGrad = ctx.createLinearGradient(0, 0, w, h);
      baseGrad.addColorStop(0, "#28140b");
      baseGrad.addColorStop(0.3, "#3d1f12");
      baseGrad.addColorStop(0.7, "#2e160d");
      baseGrad.addColorStop(1, "#1e0c06");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Procedural horizontal timber grain fibers & waves
      ctx.save();
      const numRings = 70;
      for (let i = 0; i < numRings; i++) {
        const y = (i / numRings) * h;
        const waveAmp = 12 + Math.sin(i * 0.4) * 8;
        const alpha = 0.04 + (i % 3 === 0 ? 0.05 : 0.02);

        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 30) {
          const dy =
            Math.sin((x / w) * Math.PI * 3 + i * 0.25) * waveAmp +
            Math.cos((x / w) * Math.PI * 6 + i * 0.7) * (waveAmp * 0.35);
          ctx.lineTo(x, y + dy);
        }
        ctx.strokeStyle = i % 2 === 0 ? `rgba(18, 7, 3, ${alpha * 1.5})` : `rgba(85, 43, 25, ${alpha * 1.2})`;
        ctx.lineWidth = 2.5 + (i % 4);
        ctx.stroke();
      }

      // 3. Fine wood pores & micro-grain
      for (let j = 0; j < 35; j++) {
        const yPos = (j / 35) * h + (j * 17) % 20;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(w, yPos + Math.sin(j) * 15);
        ctx.strokeStyle = "rgba(10, 4, 2, 0.07)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 4. Warm subtle radial light from top-left
      const lightGrad = ctx.createRadialGradient(w * 0.35, h * 0.25, 50, w * 0.5, h * 0.5, w * 0.75);
      lightGrad.addColorStop(0, "rgba(255, 235, 215, 0.09)");
      lightGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.05)");
      lightGrad.addColorStop(1, "rgba(0, 0, 0, 0.45)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      break;
    }

    case "oak": {
      // Golden Amber Oak Wood
      const baseGrad = ctx.createLinearGradient(0, 0, w, h);
      baseGrad.addColorStop(0, "#7a461b");
      baseGrad.addColorStop(0.5, "#935c2b");
      baseGrad.addColorStop(1, "#693a14");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // Fine parallel wood grain
      ctx.save();
      for (let i = 0; i < 90; i++) {
        const y = (i / 90) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 40) {
          const dy = Math.sin((x / w) * Math.PI * 2.5 + i * 0.5) * 6;
          ctx.lineTo(x, y + dy);
        }
        ctx.strokeStyle = i % 2 === 0 ? "rgba(60, 30, 8, 0.12)" : "rgba(200, 140, 75, 0.10)";
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      // Soft ambient vignette
      const lightGrad = ctx.createRadialGradient(w * 0.4, h * 0.3, 100, w * 0.5, h * 0.5, w * 0.8);
      lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.1)");
      lightGrad.addColorStop(1, "rgba(20, 10, 2, 0.4)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      break;
    }

    case "marble": {
      // Italian Carrara White Marble
      const baseGrad = ctx.createLinearGradient(0, 0, w, h);
      baseGrad.addColorStop(0, "#f8fafc");
      baseGrad.addColorStop(0.5, "#f1f5f9");
      baseGrad.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // Multi-frequency diagonal veins
      ctx.save();
      const veins = [
        { startX: 0, startY: h * 0.2, endX: w, endY: h * 0.8, color: "rgba(100, 116, 139, 0.18)", width: 4 },
        { startX: w * 0.2, startY: 0, endX: w * 0.9, endY: h, color: "rgba(71, 85, 105, 0.14)", width: 3 },
        { startX: 0, startY: h * 0.6, endX: w * 0.7, endY: 0, color: "rgba(148, 163, 184, 0.15)", width: 2.5 },
        { startX: w * 0.4, startY: h, endX: w, endY: h * 0.3, color: "rgba(100, 116, 139, 0.12)", width: 3.5 },
      ];

      veins.forEach((v) => {
        ctx.beginPath();
        ctx.moveTo(v.startX, v.startY);
        const steps = 30;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const currX = v.startX + (v.endX - v.startX) * t;
          const currY = v.startY + (v.endY - v.startY) * t;
          const jitterX = Math.sin(t * 12) * 18 + Math.cos(t * 24) * 8;
          const jitterY = Math.cos(t * 15) * 16 + Math.sin(t * 30) * 8;
          ctx.lineTo(currX + jitterX, currY + jitterY);
        }
        ctx.strokeStyle = v.color;
        ctx.lineWidth = v.width;
        ctx.lineCap = "round";
        ctx.stroke();
      });

      // Ambient vignette
      const lightGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 200, w * 0.5, h * 0.5, w * 0.75);
      lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
      lightGrad.addColorStop(1, "rgba(148, 163, 184, 0.25)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      break;
    }

    case "slate": {
      // Charcoal Natural Slate Stone
      const baseGrad = ctx.createLinearGradient(0, 0, w, h);
      baseGrad.addColorStop(0, "#171a21");
      baseGrad.addColorStop(0.5, "#1f242d");
      baseGrad.addColorStop(1, "#121418");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // Stone texture fractures
      ctx.save();
      for (let i = 0; i < 40; i++) {
        const x = (i / 40) * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (Math.sin(i) * 60), h);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      const lightGrad = ctx.createRadialGradient(w * 0.4, h * 0.35, 100, w * 0.5, h * 0.5, w * 0.8);
      lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.07)");
      lightGrad.addColorStop(1, "rgba(0, 0, 0, 0.6)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      break;
    }

    case "cutting-mat": {
      // Craft Self-Healing Green Cutting Mat
      const baseGrad = ctx.createLinearGradient(0, 0, w, h);
      baseGrad.addColorStop(0, "#14532d");
      baseGrad.addColorStop(0.5, "#166534");
      baseGrad.addColorStop(1, "#0f3d20");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      // 100px major grid / 20px minor grid
      const step = 40;
      for (let x = 0; x < w; x += step) {
        const isMajor = x % (step * 5) === 0;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.strokeStyle = isMajor ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = isMajor ? 1.5 : 0.8;
        ctx.stroke();
      }

      for (let y = 0; y < h; y += step) {
        const isMajor = y % (step * 5) === 0;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.strokeStyle = isMajor ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = isMajor ? 1.5 : 0.8;
        ctx.stroke();
      }

      // 45 degree guideline
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2);
      ctx.lineTo(w * 0.8, h);
      ctx.strokeStyle = "rgba(250, 204, 21, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Soft vignette
      const lightGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 200, w * 0.5, h * 0.5, w * 0.75);
      lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
      lightGrad.addColorStop(1, "rgba(0, 0, 0, 0.45)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      break;
    }

    case "leather": {
      // Executive Saddle Brown Leather Blotter
      const baseGrad = ctx.createLinearGradient(0, 0, w, h);
      baseGrad.addColorStop(0, "#3a1d10");
      baseGrad.addColorStop(0.5, "#4c2616");
      baseGrad.addColorStop(1, "#281208");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // Saddle stitch dashed border
      ctx.save();
      const pad = 36;
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

      // Fine leather pebble grain
      for (let i = 0; i < 50; i++) {
        const y = (i / 50) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const lightGrad = ctx.createRadialGradient(w * 0.4, h * 0.35, 100, w * 0.5, h * 0.5, w * 0.8);
      lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.07)");
      lightGrad.addColorStop(1, "rgba(0, 0, 0, 0.5)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      break;
    }

    case "studio":
    default: {
      // Studio Neutral Grey Surface
      const baseGrad = ctx.createLinearGradient(0, 0, w, h);
      baseGrad.addColorStop(0, "#cbd5e1");
      baseGrad.addColorStop(0.5, "#94a3b8");
      baseGrad.addColorStop(1, "#64748b");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      const lightGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 150, w * 0.5, h * 0.5, w * 0.75);
      lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.35)");
      lightGrad.addColorStop(1, "rgba(15, 23, 42, 0.4)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
  }

  ctx.restore();
}

/**
 * Draws the realistic laminated PVC pouch around the card,
 * including heat-sealed welded edge crimping, translucent margins,
 * ambient shadows, and specular plastic gloss highlights.
 */
export function drawPvcLaminatedPouch(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  scale: number = 1.0,
  options: {
    margin?: number;
    sheen?: number;
    showPouch?: boolean;
  } = {}
) {
  const margin = (options.margin ?? 26) * scale;
  const showPouch = options.showPouch !== false;
  const sheen = (options.sheen ?? 60) / 100;

  ctx.save();

  if (!showPouch) {
    // Isolated card drop shadow without pouch
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 32 * scale;
    ctx.shadowOffsetX = 10 * scale;
    ctx.shadowOffsetY = 18 * scale;
    const r = 24 * scale;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, r);
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fill();
    ctx.restore();
    ctx.restore();
    return;
  }

  const pouchX = cardX - margin;
  const pouchY = cardY - margin;
  const pouchW = cardW + margin * 2;
  const pouchH = cardH + margin * 2;
  const pouchRadius = 30 * scale;

  // 1. Multi-Stage Realistic Table Drop Shadow
  // 1A. Deep diffuse soft shadow (far blur)
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 42 * scale;
  ctx.shadowOffsetX = 12 * scale;
  ctx.shadowOffsetY = 24 * scale;
  ctx.beginPath();
  ctx.roundRect(pouchX, pouchY, pouchW, pouchH, pouchRadius);
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fill();
  ctx.restore();

  // 1B. Sharp ambient occlusion contact shadow (near blur)
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 10 * scale;
  ctx.shadowOffsetX = 3 * scale;
  ctx.shadowOffsetY = 6 * scale;
  ctx.beginPath();
  ctx.roundRect(pouchX, pouchY, pouchW, pouchH, pouchRadius);
  ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
  ctx.fill();
  ctx.restore();

  // 2. Transparent Clear PVC Pouch Base Layer (slightly milky/refractive)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(pouchX, pouchY, pouchW, pouchH, pouchRadius);
  ctx.fillStyle = "rgba(240, 248, 255, 0.08)";
  ctx.fill();

  // 3. Heat-Sealed Welded Crimp Edge (4.5px strip around outer rim)
  const crimpBorder = 5.5 * scale;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

  // Draw micro-crimping textured ridges along the 4 edges
  const drawEdgeCrimping = () => {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1 * scale;
    const step = 4 * scale;

    // Top crimp border
    for (let x = pouchX + pouchRadius; x < pouchX + pouchW - pouchRadius; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, pouchY);
      ctx.lineTo(x + 2 * scale, pouchY + crimpBorder);
      ctx.stroke();
    }
    // Bottom crimp border
    for (let x = pouchX + pouchRadius; x < pouchX + pouchW - pouchRadius; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, pouchY + pouchH - crimpBorder);
      ctx.lineTo(x + 2 * scale, pouchY + pouchH);
      ctx.stroke();
    }
    // Left crimp border
    for (let y = pouchY + pouchRadius; y < pouchY + pouchH - pouchRadius; y += step) {
      ctx.beginPath();
      ctx.moveTo(pouchX, y);
      ctx.lineTo(pouchX + crimpBorder, y + 2 * scale);
      ctx.stroke();
    }
    // Right crimp border
    for (let y = pouchY + pouchRadius; y < pouchY + pouchH - pouchRadius; y += step) {
      ctx.beginPath();
      ctx.moveTo(pouchX + pouchW - crimpBorder, y);
      ctx.lineTo(pouchX + pouchW, y + 2 * scale);
      ctx.stroke();
    }
    ctx.restore();
  };
  drawEdgeCrimping();

  // 4. Subtle air pocket boundary / card indentation ring
  // Where the plastic film conforms over the 0.76mm card edge
  const cardR = 24 * scale;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX - 1.5 * scale, cardY - 1.5 * scale, cardW + 3 * scale, cardH + 3 * scale, cardR);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1.8 * scale;
  ctx.stroke();

  // Card edge dark shadow border
  ctx.beginPath();
  ctx.roundRect(cardX + 1.5 * scale, cardY + 1.5 * scale, cardW, cardH, cardR);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
  ctx.lineWidth = 2 * scale;
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Draws the surface plastic sheen & glossy specular highlight across the card + pouch
 */
export function drawPvcGlossySheen(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  scale: number = 1.0,
  options: {
    margin?: number;
    sheen?: number;
    showPouch?: boolean;
  } = {}
) {
  const margin = options.showPouch !== false ? (options.margin ?? 26) * scale : 0;
  const sheen = (options.sheen ?? 60) / 100;
  if (sheen <= 0) return;

  const x = cardX - margin;
  const y = cardY - margin;
  const w = cardW + margin * 2;
  const h = cardH + margin * 2;
  const r = (options.showPouch !== false ? 30 : 24) * scale;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();

  // Primary diagonal specular light reflection band
  const sheenGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  sheenGrad.addColorStop(0, `rgba(255, 255, 255, ${0.18 * sheen})`);
  sheenGrad.addColorStop(0.25, `rgba(255, 255, 255, ${0.05 * sheen})`);
  sheenGrad.addColorStop(0.48, `rgba(255, 255, 255, ${0.28 * sheen})`);
  sheenGrad.addColorStop(0.53, `rgba(255, 255, 255, ${0.12 * sheen})`);
  sheenGrad.addColorStop(0.75, "rgba(255, 255, 255, 0.0)");
  sheenGrad.addColorStop(1, `rgba(255, 255, 255, ${0.08 * sheen})`);

  ctx.fillStyle = sheenGrad;
  ctx.fillRect(x, y, w, h);

  // Soft secondary top-rim reflection
  const topGrad = ctx.createLinearGradient(x, y, x, y + 60 * scale);
  topGrad.addColorStop(0, `rgba(255, 255, 255, ${0.22 * sheen})`);
  topGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(x, y, w, 60 * scale);

  ctx.restore();
}
