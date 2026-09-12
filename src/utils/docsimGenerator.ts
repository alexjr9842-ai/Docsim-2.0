import { ComponentDef, DocSimTemplate } from "../types";

// Indian Name dataset for realistic synthetic document generation
export const SAMPLE_NAMES = [
  { en: "AARAV SHARMA", hi: "आरव शर्मा", ta: "ஆரவ் சர்மா", gender: "MALE" },
  { en: "PRIYA PATEL", hi: "प्रिया पटेल", ta: "பிரியா படேல்", gender: "FEMALE" },
  { en: "ROHAN GUPTA", hi: "रोहन गुप्ता", ta: "ரோஹன் குப்தா", gender: "MALE" },
  { en: "ANANYA IYER", hi: "अनन्या अय्यर", ta: "அனன்யா ஐயர்", gender: "FEMALE" },
  { en: "VIKRAMADITYA SINGH", hi: "विक्रमादित्य सिंह", ta: "விக்ரமாதித்யா சிங்", gender: "MALE" },
  { en: "MEERA SUNDARAM", hi: "मीरा सुंदरम", ta: "மீரா சுந்தரம்", gender: "FEMALE" },
  { en: "KARTHIK RAMAN", hi: "कार्तिक रमन", ta: "கார்த்திக் ராமன்", gender: "MALE" },
  { en: "DEEPIKA VERMA", hi: "दीपिका वर्मा", ta: "தீபிகா வர்மா", gender: "FEMALE" },
  { en: "ADITYA MUKHERJEE", hi: "आदित्य मुखर्जी", ta: "ஆதித்யா முகர்ஜி", gender: "MALE" },
  { en: "SNEHA REDDY", hi: "स्नेहा रेड्डी", ta: "சினேகா ரெட்டி", gender: "FEMALE" },
];

export const FATHER_NAMES = [
  { en: "RAMESH CHANDRA SHARMA", hi: "रमेश चंद्र शर्मा", ta: "ரமேஷ் சந்திர சர்மா" },
  { en: "SURESH PATEL", hi: "सुरेश पटेल", ta: "சுரேஷ் படேல்" },
  { en: "MAHESH GUPTA", hi: "महेश गुप्ता", ta: "மகேஷ் குப்தா" },
  { en: "KRISHNAN IYER", hi: "कृष्णन अय्यर", ta: "கிருஷ்ணன் ஐயர்" },
  { en: "RAJENDRA SINGH", hi: "राजेंद्र सिंह", ta: "ராஜேந்திர சிங்" },
];

export const SAMPLE_ADDRESSES = [
  "Flat 402, Green Valley Apartments, MG Road, Bengaluru - 560001",
  "12/4B Gandhi Nagar, Anna Salai, Chennai, Tamil Nadu - 600002",
  "Plot 88, Sector 15, Rohini, New Delhi - 110085",
  "House No. 45, Bandra West, Mumbai, Maharashtra - 400050",
];

// Simple regex string expander for patterns common in DocSim templates
export function generateFromRegex(pattern: string): string {
  if (!pattern) return "";

  // Aadhaar ID: \d\d\d\d  \d\d\d\d  \d\d\d\d
  if (pattern.includes("\\d\\d\\d\\d  \\d\\d\\d\\d  \\d\\d\\d\\d")) {
    const p1 = Math.floor(2000 + Math.random() * 7999);
    const p2 = Math.floor(1000 + Math.random() * 8999);
    const p3 = Math.floor(1000 + Math.random() * 8999);
    return `${p1}  ${p2}  ${p3}`;
  }

  // PAN: [A-Z]{5}[0-9]{4}[A-Z]
  if (pattern.includes("[A-Z]{5}") || pattern.includes("ABCDE")) {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let pan = "";
    for (let i = 0; i < 5; i++) pan += letters[Math.floor(Math.random() * letters.length)];
    pan += Math.floor(1000 + Math.random() * 9000);
    pan += letters[Math.floor(Math.random() * letters.length)];
    return pan;
  }

  // Date regex: (0[1-9]|[12][0-9]|3[01])[/](0[1-9]|1[012])[/](19|20)\d\d
  if (pattern.includes("0[1-9]") && pattern.includes("[/]")) {
    const day = String(Math.floor(1 + Math.random() * 28)).padStart(2, "0");
    const month = String(Math.floor(1 + Math.random() * 12)).padStart(2, "0");
    const year = String(Math.floor(1965 + Math.random() * 40));
    return `${day}/${month}/${year}`;
  }

  // Voter Card: [A-Z]{3}[0-9]{7}
  if (pattern.includes("[A-Z]{3}") || pattern.includes("Voter")) {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let epic = "";
    for (let i = 0; i < 3; i++) epic += letters[Math.floor(Math.random() * letters.length)];
    epic += Math.floor(1000000 + Math.random() * 9000000);
    return epic;
  }

  // Generic fallback: replace \d with random digits
  return pattern
    .replace(/\\d/g, () => String(Math.floor(Math.random() * 10)))
    .replace(/\[0-9\]/g, () => String(Math.floor(Math.random() * 10)))
    .replace(/\(.*?\)/g, "01/01/1990")
    .replace(/\[\^.*?\]/g, "A")
    .replace(/\[/g, "")
    .replace(/\]/g, "")
    .replace(/\\/g, "");
}

// Generate values for all components of a template
export function generateSyntheticFieldValues(template: DocSimTemplate): Record<string, string> {
  const values: Record<string, string> = {};
  const randomPerson = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
  const randomFather = FATHER_NAMES[Math.floor(Math.random() * FATHER_NAMES.length)];

  // Process components
  for (const [key, comp] of Object.entries(template.components || {})) {
    if (comp.type === "image") {
      if (comp.filler_mode === "qr") {
        values[key] = `DOCSIM-VERIFIED-${Math.floor(Math.random() * 100000000)}`;
      } else if (comp.filler_mode === "person_face" || comp.filler_mode === "random" || key === "photo") {
        values[key] = randomPerson.gender === "FEMALE"
          ? "/repo-assets/images/people/female_generic.png"
          : "/repo-assets/images/people/male_generic.jpg";
      } else {
        values[key] = "/repo-assets/images/people/male_generic.jpg";
      }
      continue;
    }

    if (comp.filler_mode === "fixed" && comp.filler_text) {
      values[key] = comp.filler_text;
    } else if (comp.filler_mode === "regex" && comp.filler_regex) {
      values[key] = generateFromRegex(comp.filler_regex);
    } else if (comp.filler_mode === "array" && comp.filler_options && comp.filler_options.length > 0) {
      if (comp.entity === "gender") {
        if (comp.lang === "ta") {
          values[key] = randomPerson.gender === "MALE" ? "ஆண்" : "பெண்";
        } else if (comp.lang === "hi") {
          values[key] = randomPerson.gender === "MALE" ? "पुरुष" : "महिला";
        } else {
          values[key] = randomPerson.gender;
        }
      } else {
        values[key] = comp.filler_options[Math.floor(Math.random() * comp.filler_options.length)];
      }
    } else if (comp.filler_mode === "transliteration" && comp.filler_source) {
      if (comp.entity === "name" || key.includes("name")) {
        values[key] = comp.lang === "ta" ? randomPerson.ta : comp.lang === "hi" ? randomPerson.hi : randomPerson.en;
      } else if (key.includes("father")) {
        values[key] = comp.lang === "ta" ? randomFather.ta : comp.lang === "hi" ? randomFather.hi : randomFather.en;
      } else {
        values[key] = values[comp.filler_source] || "மாதிரி";
      }
    } else if (comp.filler_type === "full_name" || comp.entity === "name" || key.includes("name")) {
      if (key.includes("father")) {
        values[key] = comp.lang === "ta" ? randomFather.ta : comp.lang === "hi" ? randomFather.hi : randomFather.en;
      } else {
        values[key] = comp.lang === "ta" ? randomPerson.ta : comp.lang === "hi" ? randomPerson.hi : randomPerson.en;
      }
    } else if (comp.entity === "date_of_birth" || key.includes("dob")) {
      values[key] = generateFromRegex("(0[1-9]|[12][0-9]|3[01])[/](0[1-9]|1[012])[/](19|20)\\d\\d");
    } else if (comp.entity === "id" || key.includes("id") || key.includes("number")) {
      values[key] = generateFromRegex("\\d\\d\\d\\d  \\d\\d\\d\\d  \\d\\d\\d\\d");
    } else {
      values[key] = comp.text || `Sample ${key}`;
    }
  }

  // Process printed fields (fixed text)
  for (const [key, field] of Object.entries(template.printed_fields || {})) {
    if (field.text) {
      values[`printed_${key}`] = field.text;
    }
  }

  return values;
}

// Ensure fonts are registered in the browser
const loadedFontFaces = new Set<string>();

export async function ensureFontsLoaded(template: DocSimTemplate): Promise<void> {
  const fontPaths: string[] = [];

  if (template.defaults?.font_files) {
    fontPaths.push(...Object.values(template.defaults.font_files));
  }

  for (const comp of Object.values(template.components || {})) {
    if (comp.font_file) fontPaths.push(comp.font_file);
  }

  for (const fontPath of fontPaths) {
    if (!fontPath || loadedFontFaces.has(fontPath)) continue;
    const fontName = getFontFamilyName(fontPath);
    try {
      const fontUrl = `/repo-assets/${fontPath}`;
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
      const loaded = await fontFace.load();
      document.fonts.add(loaded);
      loadedFontFaces.add(fontPath);
    } catch (e) {
      console.warn(`Could not load font ${fontPath}:`, e);
    }
  }
}

export function getFontFamilyName(fontFilePath: string): string {
  if (!fontFilePath) return "Arial, sans-serif";
  const baseName = fontFilePath.split("/").pop()?.replace(/\.[^/.]+$/, "") || "CustomFont";
  return `DocSim_${baseName}`;
}

// Generate simple visual QR code data matrix onto canvas
export function drawSimpleQRCode(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, width, height);

  // Draw simulated QR matrix with finder patterns at 3 corners
  const modules = 21;
  const cellSize = width / modules;

  ctx.fillStyle = "#000000";

  // Top-left finder pattern
  drawFinderPattern(ctx, x, y, cellSize);
  // Top-right finder pattern
  drawFinderPattern(ctx, x + (modules - 7) * cellSize, y, cellSize);
  // Bottom-left finder pattern
  drawFinderPattern(ctx, x, y + (modules - 7) * cellSize, cellSize);

  // Hash the text to make a deterministic realistic pattern
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // Skip finder areas
      if (
        (r < 7 && c < 7) ||
        (r < 7 && c >= modules - 7) ||
        (r >= modules - 7 && c < 7)
      ) {
        continue;
      }
      // Pseudo random module based on hash and position
      const pseudo = Math.sin(hash + r * 13 + c * 37);
      if (pseudo > 0.05) {
        ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
      }
    }
  }
}

function drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number) {
  ctx.fillRect(x, y, 7 * cell, 7 * cell);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + cell, y + cell, 5 * cell, 5 * cell);
  ctx.fillStyle = "#000000";
  ctx.fillRect(x + 2 * cell, y + 2 * cell, 3 * cell, 3 * cell);
}
