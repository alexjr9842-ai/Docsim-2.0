export interface ComponentDef {
  type: "text" | "image";
  filler_mode?: "random" | "transliteration" | "fixed" | "regex" | "array" | "qr" | "person_face" | "signature" | string;
  filler_type?: string;
  filler_source?: string;
  filler_text?: string;
  filler_regex?: string;
  filler_options?: string[];
  string_len_min?: number;
  string_len_max?: number;
  version_min?: number;
  version_max?: number;
  image_folder?: string;
  text?: string;
  lang?: string;
  entity?: string;
  font_file?: string;
  font_size?: number;
  font_color?: string;
  location: {
    x_left: number;
    y_top: number;
  };
  dims?: {
    width: number;
    height: number;
  };
}

export interface DocSimTemplate {
  doc_name: string;
  background_img: string;
  defaults: {
    split_words?: boolean;
    lang?: string;
    font_files?: Record<string, string>;
    font_size?: number;
    font_color?: string;
  };
  debug_mode?: boolean;
  components: Record<string, ComponentDef>;
  printed_fields?: Record<string, ComponentDef>;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  extension?: string;
  children?: FileNode[];
}

export interface GitStatus {
  branch: string;
  isClean: boolean;
  totalChanges: number;
  modified: string[];
  untracked: string[];
  staged: string[];
  deleted: string[];
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  subject: string;
}

export interface AugmentationConfig {
  debug?: boolean;
  random_sequence?: boolean;
  max_augmentations_per_image?: number;
  augmentations: Record<string, any>;
  mutually_exclusive_augmentations?: string[][];
}

export type ActiveTab = "real-card" | "psd" | "template-designer" | "simulator" | "augmentation" | "editor" | "git";

export interface PsdLayerItem {
  id: string;
  name: string;
  type: "text" | "image" | "shape";
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
  blendMode?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  textAlign?: "left" | "center" | "right";
  imageDataUrl?: string;
}

export interface PsdDocumentData {
  name: string;
  path?: string;
  width: number;
  height: number;
  layers: PsdLayerItem[];
}

export function getComponentEntries(components?: Record<string, ComponentDef>): [string, ComponentDef][] {
  if (!components) return [];
  return Object.entries(components) as [string, ComponentDef][];
}
