import { initializeCanvas, readPsd, writePsdUint8Array, Psd, Layer } from "ag-psd";
import { PsdDocumentData, PsdLayerItem, DocSimTemplate, ComponentDef } from "../types";

let isCanvasInitialized = false;

export function ensurePsdCanvas() {
  if (typeof window === "undefined" || isCanvasInitialized) return;
  try {
    initializeCanvas(
      (width: number, height: number) => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        return canvas;
      },
      (width: number, height: number) => {
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        return ctx ? ctx.createImageData(Math.max(1, width), Math.max(1, height)) : null;
      }
    );
    isCanvasInitialized = true;
  } catch (e) {
    console.warn("ag-psd initializeCanvas warning:", e);
  }
}

export function parsePsdFromUint8(buffer: Uint8Array, fileName = "Document.psd"): PsdDocumentData {
  ensurePsdCanvas();

  let psd: Psd;
  try {
    psd = readPsd(buffer, {
      skipLayerImageData: false,
      skipCompositeImageData: false,
      skipThumbnail: true,
    });
  } catch (err) {
    console.warn("Standard read failed, retrying without layer image data:", err);
    psd = readPsd(buffer, {
      skipLayerImageData: true,
      skipCompositeImageData: true,
      skipThumbnail: true,
    });
  }

  const width = psd.width || 1000;
  const height = psd.height || 640;
  const layers: PsdLayerItem[] = [];

  function processLayer(l: Layer, index: number) {
    if (l.children && l.children.length > 0) {
      l.children.forEach((child, cIdx) => processLayer(child, index * 100 + cIdx));
      return;
    }

    const left = Math.round(l.left ?? 0);
    const top = Math.round(l.top ?? 0);
    const right = Math.round(l.right ?? (l.left ? l.left + 200 : width));
    const bottom = Math.round(l.bottom ?? (l.top ? l.top + 40 : height));
    const lWidth = Math.max(10, right - left);
    const lHeight = Math.max(10, bottom - top);

    const isText = Boolean(l.text?.text);
    const isVisible = l.hidden !== true;
    const opacity = typeof l.opacity === "number" ? l.opacity : 1;

    let textVal = l.text?.text || "";
    let fontSize = 24;
    let fontFamily = "Arial";
    let fontColor = "#111827";

    if (l.text) {
      if (l.text.style?.fontSize) {
        fontSize = Math.round(l.text.style.fontSize);
      }
      if (l.text.style?.font?.name) {
        fontFamily = l.text.style.font.name;
      }
      if (l.text.style?.fillColor) {
        const fc = l.text.style.fillColor as any;
        if (typeof fc.r === "number" && typeof fc.g === "number" && typeof fc.b === "number") {
          fontColor = `rgb(${Math.round(fc.r)}, ${Math.round(fc.g)}, ${Math.round(fc.b)})`;
        }
      }
    }

    let imageDataUrl: string | undefined;
    if (l.canvas) {
      try {
        imageDataUrl = l.canvas.toDataURL("image/png");
      } catch (e) {
        // canvas tainted or empty
      }
    }

    const type: "text" | "image" | "shape" = isText
      ? "text"
      : imageDataUrl || (lWidth > 300 && lHeight > 300)
      ? "image"
      : "shape";

    layers.push({
      id: `layer_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      name: l.name || (isText ? textVal.substring(0, 20) : `Layer ${index + 1}`),
      type,
      left,
      top,
      width: lWidth,
      height: lHeight,
      opacity,
      visible: isVisible,
      blendMode: l.blendMode || "normal",
      text: textVal,
      fontSize,
      fontFamily,
      fontColor,
      textAlign: "left",
      imageDataUrl,
    });
  }

  if (psd.children && psd.children.length > 0) {
    psd.children.forEach((c, idx) => processLayer(c, idx));
  } else {
    // If no layers, create a default base layer
    layers.push({
      id: `layer_base_0`,
      name: "Background",
      type: "shape",
      left: 0,
      top: 0,
      width,
      height,
      opacity: 1,
      visible: true,
    });
  }

  return {
    name: fileName,
    width,
    height,
    layers,
  };
}

export function generatePsdUint8Array(doc: PsdDocumentData): Uint8Array {
  ensurePsdCanvas();

  const children: Layer[] = doc.layers.map((l) => {
    const layerObj: Layer = {
      name: l.name,
      left: l.left,
      top: l.top,
      right: l.left + l.width,
      bottom: l.top + l.height,
      opacity: l.opacity,
      hidden: !l.visible,
    };

    if (l.type === "text" && l.text) {
      layerObj.text = {
        text: l.text,
        style: {
          fontSize: l.fontSize || 24,
          font: { name: l.fontFamily || "Arial" },
        },
      };
    }

    return layerObj;
  });

  const psd: Psd = {
    width: doc.width,
    height: doc.height,
    children,
  };

  return writePsdUint8Array(psd);
}

export function convertPsdToDocSimTemplate(
  doc: PsdDocumentData,
  renderedCanvas: HTMLCanvasElement | null
): { template: DocSimTemplate; backgroundDataUrl: string } {
  const components: Record<string, ComponentDef> = {};
  const printed_fields: Record<string, ComponentDef> = {};

  // Find text and image layers
  doc.layers.forEach((layer, idx) => {
    if (!layer.visible) return;

    const keyName = (layer.name || `field_${idx}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "") || `field_${idx}`;

    const lowerName = (layer.name + " " + (layer.text || "")).toLowerCase();

    // Check if it's fixed printed header vs dynamic field
    const isPrinted =
      lowerName.includes("government") ||
      lowerName.includes("department") ||
      lowerName.includes("republic") ||
      lowerName.includes("union of india") ||
      lowerName.includes("income tax") ||
      lowerName.includes("header") ||
      lowerName.includes("card") ||
      lowerName.includes("title");

    if (layer.type === "text") {
      let filler_mode = "random";
      let filler_regex: string | undefined;
      let filler_type: string | undefined;
      let entity = keyName;

      // Smart pattern classification
      if (lowerName.includes("date") || lowerName.includes("dob") || /\d{2}\/\d{2}\/\d{4}/.test(layer.text || "")) {
        filler_mode = "regex";
        filler_regex = "\\d{2}/\\d{2}/\\d{4}";
        entity = "date_of_birth";
      } else if (lowerName.includes("aadhaar") || /\d{4}\s\d{4}\s\d{4}/.test(layer.text || "")) {
        filler_mode = "regex";
        filler_regex = "\\d{4} \\d{4} \\d{4}";
        entity = "aadhaar_number";
      } else if (lowerName.includes("pan") || /[A-Z]{5}\d{4}[A-Z]/.test(layer.text || "")) {
        filler_mode = "regex";
        filler_regex = "[A-Z]{5}\\d{4}[A-Z]";
        entity = "pan_number";
      } else if (lowerName.includes("name")) {
        filler_mode = "random";
        entity = "name";
      } else if (lowerName.includes("gender") || lowerName.includes("sex")) {
        filler_mode = "regex";
        filler_regex = "MALE|FEMALE";
        entity = "gender";
      }

      // Check for Indic characters
      const hasIndic = /[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0A80-\u0AFF]/.test(layer.text || "");
      if (hasIndic) {
        filler_mode = "transliteration";
      }

      const comp: ComponentDef = {
        type: "text",
        text: layer.text || "",
        entity,
        filler_mode: isPrinted ? "fixed" : filler_mode,
        filler_regex,
        filler_type,
        font_size: layer.fontSize || 24,
        font_color: layer.fontColor || "#000000",
        location: {
          x_left: layer.left,
          y_top: layer.top,
        },
        dims: {
          width: layer.width,
          height: layer.height,
        },
      };

      if (isPrinted) {
        printed_fields[keyName] = comp;
      } else {
        components[keyName] = comp;
      }
    } else if (layer.type === "image") {
      let filler_mode = "random";
      let entity = "image";

      if (lowerName.includes("photo") || lowerName.includes("face") || lowerName.includes("avatar")) {
        filler_mode = "person_face";
        entity = "person_face";
      } else if (lowerName.includes("qr") || lowerName.includes("barcode")) {
        filler_mode = "qr";
        entity = "qr_code";
      }

      components[keyName] = {
        type: "image",
        entity,
        filler_mode,
        location: {
          x_left: layer.left,
          y_top: layer.top,
        },
        dims: {
          width: layer.width,
          height: layer.height,
        },
      };
    }
  });

  // Extract background
  let backgroundDataUrl = "";
  if (renderedCanvas) {
    try {
      backgroundDataUrl = renderedCanvas.toDataURL("image/jpeg", 0.95);
    } catch (e) {
      console.warn("Could not export background image:", e);
    }
  }

  const docName = doc.name.replace(/\.psd$/i, "") || "Custom_Document";

  const template: DocSimTemplate = {
    doc_name: docName,
    background_img: "background.jpg",
    defaults: {
      split_words: false,
      lang: "en",
      font_size: 24,
      font_color: "#000000",
      font_files: {
        en: "fonts/arial.ttf",
        hi: "fonts/noto_sans_devanagari.ttf",
      },
    },
    components,
    printed_fields,
  };

  return {
    template,
    backgroundDataUrl,
  };
}
