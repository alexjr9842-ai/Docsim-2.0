import QRCode from "qrcode";
import { PsdDocumentData, PsdLayerItem } from "../types";
import { generatePsdUint8Array } from "./psdHelper";

export type CardTypeKey =
  | "pan-latest"
  | "aadhaar-front"
  | "aadhaar-back"
  | "driving-license"
  | "voter-id"
  | "student-card"
  | "employee-card"
  | "loyalty-card"
  | "library-card";

export interface CardLayerConfig {
  id: string;
  name: string;
  type: "text" | "image" | "signature" | "qr" | "barcode" | "chip" | "hologram";
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width?: number; // percentage 0 - 100
  height?: number; // percentage 0 - 100
  fontSize?: number; // px relative to 1012x638
  fontFamily?: string;
  color?: string;
  letterSpacing?: string;
  textAlign?: "left" | "center" | "right";
  visible: boolean;
  locked?: boolean;
  opacity?: number;
  dataKey?: keyof CardSectionData;
  prefix?: string;
  uppercase?: boolean;
}

export interface CardSectionData {
  id: string;
  presetKey: CardTypeKey;
  cardType: CardTypeKey;
  cardTitle: string;
  cardTitleHi: string;
  subtitle: string;
  emblemType: "ashoka" | "uidai" | "incometax" | "transport" | "election" | "academic" | "corporate" | "vip" | "custom" | "none";
  emblemCustomUrl?: string;
  tagline: string;

  // Identity
  nameEn: string;
  nameHi: string;
  fatherNameEn: string;
  fatherNameHi: string;
  dob: string; // DD/MM/YYYY
  gender: "MALE" | "FEMALE" | "TRANSGENDER";
  genderHi: string;
  bloodGroup: string;
  addressEn: string;
  addressHi: string;
  pinCode: string;

  // Institutional / Professional fields
  studentRollNo: string;
  courseDegree: string;
  department: string;
  academicYear: string;
  designation: string;
  employeeCode: string;
  emergencyContact: string;
  membershipTier: string;
  pointsBalance: string;
  libraryLimit: string;

  // Identifiers
  idNumber: string;
  doi: string; // Date of Issue
  doe: string; // Date of Expiry / Validity
  isLifetime: boolean;
  vehicleClasses: string; // MCWG, LMV

  // Photo & PP Size Controls
  photoUrl: string;
  photoScale?: number; // 0.5 to 2.5 (selfie zoom)
  photoOffsetX?: number; // -50 to 50 % (selfie horizontal centering)
  photoOffsetY?: number; // -50 to 50 % (selfie vertical eye/chin centering)
  photoBackdrop?: "none" | "studio-white" | "studio-blue" | "studio-grey";
  photoFilter?: "none" | "govt-id" | "grayscale" | "high-contrast" | "warm";
  photoBrightness?: number; // 0.5 to 1.5
  photoContrast?: number;   // 0.5 to 1.5
  hasPassportBorder?: boolean;
  passportBorderColor?: string;
  passportBorderWidth?: number;
  lockPpPlacement?: boolean; // locks PP size and position to official card spec
  photoOpacity?: number; // 0.1 to 1.0
  
  signatureUrl: string;
  signatureColor: string; // "#1e40af" or "#111827"
  hasGhostPhoto: boolean;

  // Security features
  hasQrCode: boolean;
  qrPayload: string;
  hasSmartChip: boolean;
  hasHologram: boolean;
  hasBarcode: boolean;
  hasGuilloche: boolean;

  // Active card side and backside layers
  activeSide?: "front" | "back";
  backLayers?: CardLayerConfig[];

  // Backside demographic & legal fields
  backAddressEn?: string;
  backAddressHi?: string;
  backPinCode?: string;
  backEmergencyContact?: string;
  backIssuingAuthority?: string;
  backTerms?: string;
  backBarcodePayload?: string;

  // Tabletop Photorealistic Mockup & PVC Lamination Pouch
  isTabletopMode?: boolean;
  tableDesign?: "walnut" | "oak" | "marble" | "slate" | "cutting-mat" | "leather" | "studio" | "custom";
  customTableUrl?: string;
  showPvcPouch?: boolean;
  pvcPouchMargin?: number;
  pvcPouchSheen?: number;

  // Photoshop Finishing & Physical Styling
  finish: "glossy" | "matte" | "vintage";
  lightAngle: number; // 0 - 360
  plasticSheen: number; // 0 - 100
  cardWear: number; // 0 - 100
  backgroundPath?: string;
  backgroundColor?: string;

  // Active layers (customizable in Photoshop Mode)
  layers: CardLayerConfig[];
}

export interface CardPresetConfig {
  key: CardTypeKey;
  name: string;
  category: "Government & National ID" | "Institutional & Membership Cards";
  badge: string;
  description: string;
  permanentDescription: string;
  defaultPsdPath?: string;
  defaultBackground: string;
  defaultData: Partial<CardSectionData>;
  defaultLayers: CardLayerConfig[];
}

// 1. PAN CARD DEFAULT LAYERS (Calibrated exactly to DocSim PAN background)
const PAN_DEFAULT_LAYERS: CardLayerConfig[] = [
  {
    id: "pan_number",
    name: "PAN Card Number",
    type: "text",
    x: 37.2,
    y: 41.8,
    fontSize: 34,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#047857",
    letterSpacing: "0.14em",
    textAlign: "left",
    visible: true,
    dataKey: "idNumber",
    uppercase: true,
  },
  {
    id: "name_en",
    name: "Cardholder Name (English)",
    type: "text",
    x: 4.8,
    y: 55.5,
    fontSize: 24,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "nameEn",
    uppercase: true,
  },
  {
    id: "father_en",
    name: "Father's Name (English)",
    type: "text",
    x: 4.8,
    y: 70.5,
    fontSize: 24,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "fatherNameEn",
    uppercase: true,
  },
  {
    id: "dob",
    name: "Date of Birth",
    type: "text",
    x: 4.8,
    y: 85.5,
    fontSize: 24,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "dob",
  },
  {
    id: "qr",
    name: "2D Scannable QR Code",
    type: "qr",
    x: 4.4,
    y: 25.8,
    width: 14.5,
    height: 23.5,
    visible: true,
  },
  {
    id: "photo",
    name: "Cardholder Portrait",
    type: "image",
    x: 77.4,
    y: 41.5,
    width: 17.5,
    height: 35.5,
    visible: true,
  },
  {
    id: "signature",
    name: "Cardholder Signature",
    type: "signature",
    x: 43.5,
    y: 81.5,
    width: 32.0,
    height: 11.5,
    visible: true,
  },
];

// 2. DRIVING LICENSE DEFAULT LAYERS (Calibrated to Smart Driving License background)
const DL_DEFAULT_LAYERS: CardLayerConfig[] = [
  {
    id: "dl_top_number",
    name: "DL Number (Top Header)",
    type: "text",
    x: 23.9,
    y: 20.5,
    fontSize: 26,
    fontFamily: "'Verdana-Custom-Bold', Verdana, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "idNumber",
    uppercase: true,
  },
  {
    id: "doi",
    name: "Date of Issue",
    type: "text",
    x: 29.0,
    y: 40.2,
    fontSize: 20,
    fontFamily: "'Verdana-Custom-Bold', Verdana, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "doi",
  },
  {
    id: "validity",
    name: "Validity (NT / Expiry)",
    type: "text",
    x: 52.6,
    y: 36.2,
    fontSize: 20,
    fontFamily: "'Verdana-Custom-Bold', Verdana, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "doe",
  },
  {
    id: "dob",
    name: "Date of Birth",
    type: "text",
    x: 29.0,
    y: 57.0,
    fontSize: 20,
    fontFamily: "'Verdana-Custom-Bold', Verdana, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "dob",
  },
  {
    id: "blood",
    name: "Blood Group",
    type: "text",
    x: 52.6,
    y: 53.7,
    fontSize: 22,
    fontFamily: "'Verdana-Custom-Bold', Verdana, sans-serif",
    color: "#b91c1c",
    textAlign: "left",
    visible: true,
    dataKey: "bloodGroup",
  },
  {
    id: "name",
    name: "Driver Full Name",
    type: "text",
    x: 8.3,
    y: 68.8,
    fontSize: 24,
    fontFamily: "'Verdana-Custom-Bold', Verdana, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "nameEn",
    uppercase: true,
  },
  {
    id: "father",
    name: "Son/Daughter/Wife of",
    type: "text",
    x: 8.3,
    y: 87.2,
    fontSize: 22,
    fontFamily: "'Verdana-Custom-Bold', Verdana, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "fatherNameEn",
    uppercase: true,
  },
  {
    id: "dl_bottom_number",
    name: "DL Number (Bottom Bar)",
    type: "text",
    x: 36.0,
    y: 78.0,
    fontSize: 28,
    fontFamily: "'Share Tech Mono', 'Courier New', monospace",
    color: "#047857",
    letterSpacing: "0.12em",
    textAlign: "left",
    visible: true,
    dataKey: "idNumber",
    uppercase: true,
  },
  {
    id: "photo",
    name: "Driver Portrait (Right)",
    type: "image",
    x: 73.6,
    y: 20.2,
    width: 21.5,
    height: 43.5,
    visible: true,
  },
  {
    id: "qr",
    name: "Scannable QR Code",
    type: "qr",
    x: 73.3,
    y: 68.7,
    width: 16.5,
    height: 25.5,
    visible: true,
  },
];

// 3. VOTER ID DEFAULT LAYERS (Calibrated to ECI voter-card-front background)
const VOTER_DEFAULT_LAYERS: CardLayerConfig[] = [
  {
    id: "barcode",
    name: "Top Barcode",
    type: "barcode",
    x: 4.0,
    y: 18.2,
    width: 24.0,
    height: 4.5,
    visible: true,
  },
  {
    id: "photo",
    name: "Elector Portrait (Left)",
    type: "image",
    x: 6.0,
    y: 24.5,
    width: 22.0,
    height: 42.0,
    visible: true,
  },
  {
    id: "name_hi",
    name: "Elector Name (Hindi)",
    type: "text",
    x: 31.0,
    y: 25.0,
    fontSize: 24,
    fontFamily: "'Halant-Bold', 'Noto Sans Devanagari', sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "nameHi",
  },
  {
    id: "name_en",
    name: "Elector Name (English)",
    type: "text",
    x: 31.0,
    y: 30.5,
    fontSize: 24,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "nameEn",
    uppercase: true,
  },
  {
    id: "dob",
    name: "Date of Birth",
    type: "text",
    x: 31.0,
    y: 38.0,
    fontSize: 19,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#1e293b",
    prefix: "DOB / जन्म तिथि: ",
    textAlign: "left",
    visible: true,
    dataKey: "dob",
  },
  {
    id: "gender",
    name: "Gender",
    type: "text",
    x: 31.0,
    y: 44.0,
    fontSize: 19,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#1e293b",
    prefix: "GENDER / लिंग: ",
    textAlign: "left",
    visible: true,
    dataKey: "gender",
  },
  {
    id: "father_en",
    name: "Father / Husband Name",
    type: "text",
    x: 31.0,
    y: 50.0,
    fontSize: 19,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#1e293b",
    prefix: "FATHER / पिता: ",
    textAlign: "left",
    visible: true,
    dataKey: "fatherNameEn",
    uppercase: true,
  },
  {
    id: "voter_id_number",
    name: "EPIC Serial Number",
    type: "text",
    x: 39.5,
    y: 76.5,
    fontSize: 32,
    fontFamily: "'Arial-Custom-Bold', 'Courier New', monospace",
    color: "#047857",
    letterSpacing: "0.15em",
    textAlign: "left",
    visible: true,
    dataKey: "idNumber",
    uppercase: true,
  },
  {
    id: "qr",
    name: "ECI Scannable QR",
    type: "qr",
    x: 75.0,
    y: 24.5,
    width: 19.0,
    height: 30.0,
    visible: true,
  },
];

// 4. AADHAAR FRONT DEFAULT LAYERS
const AADHAAR_FRONT_LAYERS: CardLayerConfig[] = [
  {
    id: "photo",
    name: "Resident Photo (Left)",
    type: "image",
    x: 3.4,
    y: 24.5,
    width: 29.5,
    height: 37.2,
    visible: true,
  },
  {
    id: "name_hi",
    name: "Resident Name (Hindi)",
    type: "text",
    x: 35.1,
    y: 24.8,
    fontSize: 26,
    fontFamily: "'Halant-Bold', 'Noto Sans Devanagari', sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "nameHi",
  },
  {
    id: "name_en",
    name: "Resident Name (English)",
    type: "text",
    x: 35.1,
    y: 31.1,
    fontSize: 26,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "nameEn",
    uppercase: true,
  },
  {
    id: "dob",
    name: "Date of Birth",
    type: "text",
    x: 35.1,
    y: 37.5,
    fontSize: 20,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#1e293b",
    prefix: "जन्म तिथि / DOB: ",
    textAlign: "left",
    visible: true,
    dataKey: "dob",
  },
  {
    id: "gender",
    name: "Gender",
    type: "text",
    x: 35.1,
    y: 43.5,
    fontSize: 20,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#1e293b",
    prefix: "पुरुष / MALE",
    textAlign: "left",
    visible: true,
    dataKey: "gender",
  },
  {
    id: "aadhaar_number",
    name: "12-Digit Aadhaar Number",
    type: "text",
    x: 32.9,
    y: 82.4,
    fontSize: 36,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#047857",
    letterSpacing: "0.2em",
    textAlign: "left",
    visible: true,
    dataKey: "idNumber",
  },
  {
    id: "qr",
    name: "UIDAI Secure QR",
    type: "qr",
    x: 75.0,
    y: 48.8,
    width: 20.0,
    height: 23.2,
    visible: true,
  },
];

// 5. STUDENT CARD DEFAULT LAYERS (Meta-Toolkit style)
const STUDENT_DEFAULT_LAYERS: CardLayerConfig[] = [
  {
    id: "inst_header",
    name: "Institute Title",
    type: "text",
    x: 18.0,
    y: 6.0,
    fontSize: 24,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#ffffff",
    textAlign: "left",
    visible: true,
    dataKey: "cardTitle",
    uppercase: true,
  },
  {
    id: "inst_subtitle",
    name: "Department / Campus",
    type: "text",
    x: 18.0,
    y: 11.5,
    fontSize: 14,
    fontFamily: "'Arial-Custom-Regular', Arial, sans-serif",
    color: "#93c5fd",
    textAlign: "left",
    visible: true,
    dataKey: "subtitle",
  },
  {
    id: "photo",
    name: "Student Photo",
    type: "image",
    x: 5.0,
    y: 22.0,
    width: 24.0,
    height: 48.0,
    visible: true,
  },
  {
    id: "name_en",
    name: "Student Full Name",
    type: "text",
    x: 33.0,
    y: 24.0,
    fontSize: 26,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "nameEn",
    uppercase: true,
  },
  {
    id: "student_roll",
    name: "Roll / Enrollment No",
    type: "text",
    x: 33.0,
    y: 32.0,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#1e40af",
    prefix: "ROLL NO: ",
    textAlign: "left",
    visible: true,
    dataKey: "studentRollNo",
  },
  {
    id: "course_degree",
    name: "Course / Degree",
    type: "text",
    x: 33.0,
    y: 38.5,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#334155",
    prefix: "COURSE: ",
    textAlign: "left",
    visible: true,
    dataKey: "courseDegree",
  },
  {
    id: "academic_year",
    name: "Academic Batch / Session",
    type: "text",
    x: 33.0,
    y: 45.0,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#334155",
    prefix: "SESSION: ",
    textAlign: "left",
    visible: true,
    dataKey: "academicYear",
  },
  {
    id: "blood",
    name: "Blood Group",
    type: "text",
    x: 33.0,
    y: 51.5,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#b91c1c",
    prefix: "BLOOD GRP: ",
    textAlign: "left",
    visible: true,
    dataKey: "bloodGroup",
  },
  {
    id: "dob",
    name: "Date of Birth",
    type: "text",
    x: 33.0,
    y: 58.0,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#334155",
    prefix: "DOB: ",
    textAlign: "left",
    visible: true,
    dataKey: "dob",
  },
  {
    id: "qr",
    name: "Student ID QR Code",
    type: "qr",
    x: 77.0,
    y: 24.0,
    width: 18.0,
    height: 28.0,
    visible: true,
  },
  {
    id: "barcode",
    name: "Library Barcode",
    type: "barcode",
    x: 5.0,
    y: 78.0,
    width: 45.0,
    height: 12.0,
    visible: true,
  },
  {
    id: "signature",
    name: "Dean Signature Stamp",
    type: "signature",
    x: 68.0,
    y: 75.0,
    width: 25.0,
    height: 14.0,
    visible: true,
  },
];

// 6. EMPLOYEE BADGE DEFAULT LAYERS (Meta-Toolkit style)
const EMPLOYEE_DEFAULT_LAYERS: CardLayerConfig[] = [
  {
    id: "company_title",
    name: "Company Name",
    type: "text",
    x: 18.0,
    y: 6.5,
    fontSize: 24,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#ffffff",
    textAlign: "left",
    visible: true,
    dataKey: "cardTitle",
    uppercase: true,
  },
  {
    id: "company_sub",
    name: "Division / Branch",
    type: "text",
    x: 18.0,
    y: 12.0,
    fontSize: 14,
    fontFamily: "'Arial-Custom-Regular', Arial, sans-serif",
    color: "#a7f3d0",
    textAlign: "left",
    visible: true,
    dataKey: "subtitle",
  },
  {
    id: "photo",
    name: "Employee Portrait",
    type: "image",
    x: 5.0,
    y: 22.0,
    width: 24.0,
    height: 48.0,
    visible: true,
  },
  {
    id: "name_en",
    name: "Employee Full Name",
    type: "text",
    x: 33.0,
    y: 24.0,
    fontSize: 26,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "nameEn",
    uppercase: true,
  },
  {
    id: "designation",
    name: "Designation / Title",
    type: "text",
    x: 33.0,
    y: 31.5,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#047857",
    textAlign: "left",
    visible: true,
    dataKey: "designation",
  },
  {
    id: "employee_code",
    name: "Employee ID Code",
    type: "text",
    x: 33.0,
    y: 38.0,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#334155",
    prefix: "EMP ID: ",
    textAlign: "left",
    visible: true,
    dataKey: "employeeCode",
  },
  {
    id: "department",
    name: "Department",
    type: "text",
    x: 33.0,
    y: 44.5,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#334155",
    prefix: "DEPT: ",
    textAlign: "left",
    visible: true,
    dataKey: "department",
  },
  {
    id: "doi",
    name: "Date of Joining",
    type: "text",
    x: 33.0,
    y: 51.0,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#334155",
    prefix: "JOINED: ",
    textAlign: "left",
    visible: true,
    dataKey: "doi",
  },
  {
    id: "emergency",
    name: "Emergency Contact",
    type: "text",
    x: 33.0,
    y: 57.5,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#334155",
    prefix: "EMERGENCY: ",
    textAlign: "left",
    visible: true,
    dataKey: "emergencyContact",
  },
  {
    id: "qr",
    name: "Access Control QR",
    type: "qr",
    x: 77.0,
    y: 24.0,
    width: 18.0,
    height: 28.0,
    visible: true,
  },
  {
    id: "barcode",
    name: "Security Turnstile Barcode",
    type: "barcode",
    x: 5.0,
    y: 78.0,
    width: 45.0,
    height: 12.0,
    visible: true,
  },
];

// 7. LOYALTY CARD DEFAULT LAYERS (Meta-Toolkit style)
const LOYALTY_DEFAULT_LAYERS: CardLayerConfig[] = [
  {
    id: "club_title",
    name: "Club / Brand Title",
    type: "text",
    x: 6.0,
    y: 8.0,
    fontSize: 26,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#f59e0b",
    textAlign: "left",
    visible: true,
    dataKey: "cardTitle",
    uppercase: true,
  },
  {
    id: "tier_badge",
    name: "Membership Tier",
    type: "text",
    x: 6.0,
    y: 15.0,
    fontSize: 16,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#d97706",
    letterSpacing: "0.1em",
    textAlign: "left",
    visible: true,
    dataKey: "membershipTier",
    uppercase: true,
  },
  {
    id: "card_number",
    name: "16-Digit Member Number",
    type: "text",
    x: 6.0,
    y: 44.0,
    fontSize: 34,
    fontFamily: "'Share Tech Mono', 'Courier New', monospace",
    color: "#f8fafc",
    letterSpacing: "0.18em",
    textAlign: "left",
    visible: true,
    dataKey: "idNumber",
  },
  {
    id: "name_en",
    name: "Member Full Name",
    type: "text",
    x: 6.0,
    y: 72.0,
    fontSize: 24,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#f1f5f9",
    textAlign: "left",
    visible: true,
    dataKey: "nameEn",
    uppercase: true,
  },
  {
    id: "doe",
    name: "Valid Thru (Expiry)",
    type: "text",
    x: 62.0,
    y: 72.0,
    fontSize: 20,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#fbbf24",
    prefix: "VALID THRU: ",
    textAlign: "left",
    visible: true,
    dataKey: "doe",
  },
  {
    id: "qr",
    name: "Member Check-in QR",
    type: "qr",
    x: 77.0,
    y: 10.0,
    width: 17.0,
    height: 27.0,
    visible: true,
  },
];

// 8. LIBRARY CARD DEFAULT LAYERS (Meta-Toolkit style)
const LIBRARY_DEFAULT_LAYERS: CardLayerConfig[] = [
  {
    id: "library_title",
    name: "Library Name",
    type: "text",
    x: 18.0,
    y: 7.0,
    fontSize: 24,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#ffffff",
    textAlign: "left",
    visible: true,
    dataKey: "cardTitle",
    uppercase: true,
  },
  {
    id: "library_sub",
    name: "City / University System",
    type: "text",
    x: 18.0,
    y: 12.5,
    fontSize: 14,
    fontFamily: "'Arial-Custom-Regular', Arial, sans-serif",
    color: "#cbd5e1",
    textAlign: "left",
    visible: true,
    dataKey: "subtitle",
  },
  {
    id: "photo",
    name: "Reader Photo",
    type: "image",
    x: 5.0,
    y: 22.0,
    width: 22.0,
    height: 44.0,
    visible: true,
  },
  {
    id: "name_en",
    name: "Member Name",
    type: "text",
    x: 31.0,
    y: 24.0,
    fontSize: 26,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#0f172a",
    textAlign: "left",
    visible: true,
    dataKey: "nameEn",
    uppercase: true,
  },
  {
    id: "id_number",
    name: "Library Card Number",
    type: "text",
    x: 31.0,
    y: 32.0,
    fontSize: 20,
    fontFamily: "'Share Tech Mono', 'Courier New', monospace",
    color: "#1e3a8a",
    prefix: "CARD NO: ",
    textAlign: "left",
    visible: true,
    dataKey: "idNumber",
  },
  {
    id: "library_limit",
    name: "Borrowing Limit",
    type: "text",
    x: 31.0,
    y: 39.0,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#334155",
    prefix: "BORROWING LIMIT: ",
    textAlign: "left",
    visible: true,
    dataKey: "libraryLimit",
  },
  {
    id: "doe",
    name: "Card Expiry Date",
    type: "text",
    x: 31.0,
    y: 46.0,
    fontSize: 18,
    fontFamily: "'Arial-Custom-Bold', Arial, sans-serif",
    color: "#334155",
    prefix: "EXPIRY: ",
    textAlign: "left",
    visible: true,
    dataKey: "doe",
  },
  {
    id: "qr",
    name: "Catalog QR Code",
    type: "qr",
    x: 77.0,
    y: 24.0,
    width: 18.0,
    height: 28.0,
    visible: true,
  },
  {
    id: "barcode",
    name: "Checkout Barcode",
    type: "barcode",
    x: 5.0,
    y: 74.0,
    width: 50.0,
    height: 14.0,
    visible: true,
  },
];

export const CARD_PRESETS: CardPresetConfig[] = [
  {
    key: "pan-latest",
    name: "PAN Card (Income Tax Dept)",
    category: "Government & National ID",
    badge: "Govt / Tax",
    description: "Official Permanent Account Number Card with Income Tax Department seal, Ashoka emblem, watermarks, and 2D barcode.",
    permanentDescription: "Permanent: Ashoka Stambh, Income Tax Dept bilingual banner, watermarks, Satyameva Jayate, and pre-printed labels (नाम, पिता का नाम, जन्म की तारीख, हस्ताक्षर).",
    defaultPsdPath: "templates/PAN/Latest/template.psd",
    defaultBackground: "/repo-assets/templates/PAN/Latest/background.jpg",
    defaultLayers: PAN_DEFAULT_LAYERS,
    defaultData: {
      cardType: "pan-latest",
      cardTitle: "INCOME TAX DEPARTMENT",
      cardTitleHi: "आयकर विभाग",
      subtitle: "GOVT. OF INDIA / भारत सरकार",
      tagline: "Permanent Account Number Card",
      emblemType: "incometax",
      nameEn: "PRIYA VERMA",
      nameHi: "प्रिया वर्मा",
      fatherNameEn: "SURESH VERMA",
      fatherNameHi: "सुरेश वर्मा",
      dob: "22/11/1995",
      gender: "FEMALE",
      genderHi: "महिला",
      idNumber: "ABCDE1234F",
      doi: "14/03/2020",
      doe: "Lifetime",
      isLifetime: true,
      hasQrCode: true,
      hasSmartChip: false,
      hasHologram: true,
      hasGhostPhoto: false,
      hasBarcode: false,
      hasGuilloche: false,
      finish: "glossy",
      lightAngle: 60,
      plasticSheen: 50,
      photoUrl: "/repo-assets/images/people/female_generic.png",
      signatureColor: "#111827",
    },
  },
  {
    key: "aadhaar-front",
    name: "Aadhaar Card (UIDAI)",
    category: "Government & National ID",
    badge: "Govt / Identity",
    description: "12-Digit Indian National Identity card with UIDAI emblem, dual-script name, demographic block, and official QR code.",
    permanentDescription: "Permanent: UIDAI sun emblem, Government of India emblem, Mera Aadhaar slogan, tricolor top border, and official security guilloche base.",
    defaultPsdPath: "templates/Aadhaar/Front/template.psd",
    defaultBackground: "/repo-assets/templates/Aadhaar/Front/background.jpg",
    defaultLayers: AADHAAR_FRONT_LAYERS,
    defaultData: {
      cardType: "aadhaar-front",
      cardTitle: "GOVERNMENT OF INDIA",
      cardTitleHi: "भारत सरकार",
      subtitle: "Unique Identification Authority of India",
      tagline: "मेरा आधार, मेरी पहचान",
      emblemType: "uidai",
      nameEn: "Aarav Sharma",
      nameHi: "आरव शर्मा",
      fatherNameEn: "Rajesh Sharma",
      fatherNameHi: "राजेश शर्मा",
      dob: "15/08/1992",
      gender: "MALE",
      genderHi: "पुरुष",
      idNumber: "4521 8904 1238",
      doi: "01/01/2018",
      doe: "Lifetime",
      isLifetime: true,
      hasQrCode: true,
      hasGhostPhoto: false,
      hasHologram: false,
      hasSmartChip: false,
      hasBarcode: false,
      hasGuilloche: false,
      finish: "glossy",
      lightAngle: 45,
      plasticSheen: 35,
      photoUrl: "/repo-assets/images/people/male_generic.jpg",
    },
  },
  {
    key: "driving-license",
    name: "Smart Driving License",
    category: "Government & National ID",
    badge: "Govt / Transport",
    description: "Union of India Smart Optical Driving License with designated right-side portrait slot, RTO serials, and scannable code.",
    permanentDescription: "Permanent: Union of India Driving Licence header, Form 7 Rule 16(2), Ashoka emblem, pre-printed labels (Validity, DOI, DOB, Blood Group, Son/Daughter/Wife of).",
    defaultPsdPath: "templates/Driving-License/Smart-Front/template.psd",
    defaultBackground: "/repo-assets/templates/Driving-License/Smart-Front/background-hi.jpg",
    defaultLayers: DL_DEFAULT_LAYERS,
    defaultData: {
      cardType: "driving-license",
      cardTitle: "UNION OF INDIA - DRIVING LICENCE",
      cardTitleHi: "भारतीय संघ - चालक अनुज्ञप्ति",
      subtitle: "Transport Department, Government of NCT of Delhi",
      tagline: "Form 7 (Rule 16(2))",
      emblemType: "transport",
      nameEn: "VIKRAM CHOUDHARY",
      nameHi: "विक्रम चौधरी",
      fatherNameEn: "MAHENDRA CHOUDHARY",
      fatherNameHi: "महेन्द्र चौधरी",
      dob: "08/04/1988",
      gender: "MALE",
      genderHi: "पुरुष",
      bloodGroup: "B+",
      idNumber: "DL-0420190048291",
      doi: "12/06/2019",
      doe: "11/06/2039",
      isLifetime: false,
      vehicleClasses: "MCWG, LMV",
      hasQrCode: true,
      hasSmartChip: false,
      hasHologram: true,
      hasGhostPhoto: false,
      hasBarcode: false,
      hasGuilloche: false,
      finish: "glossy",
      lightAngle: 50,
      plasticSheen: 45,
      photoUrl: "/repo-assets/images/people/male_generic.jpg",
    },
  },
  {
    key: "voter-id",
    name: "Voter ID / EPIC Card",
    category: "Government & National ID",
    badge: "Govt / Elections",
    description: "Election Commission of India Voter Identity card with official EPIC serial, barcode, and electoral guilloche background.",
    permanentDescription: "Permanent: ELECTION COMMISSION OF INDIA, भारत निर्वाचन आयोग, ELECTOR PHOTO IDENTITY CARD, Ashoka emblem, and pre-printed field lines.",
    defaultBackground: "/repo-assets/templates/VoterCard-HI/Front/voter-card-front.jpg",
    defaultLayers: VOTER_DEFAULT_LAYERS,
    defaultData: {
      cardType: "voter-id",
      cardTitle: "ELECTION COMMISSION OF INDIA",
      cardTitleHi: "भारत निर्वाचन आयोग",
      subtitle: "ELECTOR PHOTO IDENTITY CARD / मतदाता फोटो पहचान पत्र",
      tagline: "Identity & Franchise Verification",
      emblemType: "election",
      nameEn: "SUNITA DEVI",
      nameHi: "सुनीता देवी",
      fatherNameEn: "W/O: RAMESHWAR PRASAD",
      fatherNameHi: "पति: रामेश्वर प्रसाद",
      dob: "05/10/1985",
      gender: "FEMALE",
      genderHi: "महिला",
      idNumber: "WBK2948210",
      doi: "01/01/2014",
      doe: "Lifetime",
      isLifetime: true,
      hasQrCode: true,
      hasSmartChip: false,
      hasHologram: false,
      hasGhostPhoto: false,
      hasBarcode: true,
      hasGuilloche: false,
      finish: "matte",
      lightAngle: 30,
      plasticSheen: 20,
      photoUrl: "/repo-assets/images/people/female_generic.png",
    },
  },
  {
    key: "student-card",
    name: "Student Identity Card",
    category: "Institutional & Membership Cards",
    badge: "Education",
    description: "University & College Student Identity Card with enrollment number, department, academic session, barcode, and Dean signature.",
    permanentDescription: "Permanent: University security border, student verification hologram, academic seal, and official library access barcode.",
    defaultBackground: "",
    defaultLayers: STUDENT_DEFAULT_LAYERS,
    defaultData: {
      cardType: "student-card",
      cardTitle: "NATIONAL INSTITUTE OF TECHNOLOGY",
      cardTitleHi: "राष्ट्रीय प्रौद्योगिकी संस्थान",
      subtitle: "Department of Computer Science & Engineering",
      tagline: "Student Identity & Campus Access Card",
      emblemType: "academic",
      nameEn: "RAHUL MECHE",
      nameHi: "राहुल मेचे",
      studentRollNo: "NIT/2024/CS-8402",
      courseDegree: "B.Tech (Computer Science)",
      department: "School of Computing",
      academicYear: "2024 - 2028",
      dob: "14/06/2004",
      gender: "MALE",
      genderHi: "पुरुष",
      bloodGroup: "O+",
      idNumber: "NIT-CS-2024-8402",
      doi: "01/08/2024",
      doe: "30/06/2028",
      isLifetime: false,
      hasQrCode: true,
      hasBarcode: true,
      hasSmartChip: false,
      hasHologram: true,
      hasGuilloche: true,
      finish: "glossy",
      lightAngle: 45,
      plasticSheen: 50,
      photoUrl: "/repo-assets/images/people/male_generic.jpg",
      signatureColor: "#1e40af",
    },
  },
  {
    key: "employee-card",
    name: "Corporate Employee Card",
    category: "Institutional & Membership Cards",
    badge: "Corporate",
    description: "Enterprise Executive Access Badge with employee code, designation, department, emergency contact, and turnstile barcode.",
    permanentDescription: "Permanent: Corporate security waves, turnstile RFID access zone, company banner, and employee security terms.",
    defaultBackground: "",
    defaultLayers: EMPLOYEE_DEFAULT_LAYERS,
    defaultData: {
      cardType: "employee-card",
      cardTitle: "APEX TECHNOLOGIES INC.",
      cardTitleHi: "एपेक्स टेक्नोलॉजीज",
      subtitle: "Global Engineering & Cloud Infrastructure Division",
      tagline: "Security & Facility Access Badge",
      emblemType: "corporate",
      nameEn: "SARAH CONNOR",
      nameHi: "सारा कॉनर",
      designation: "Principal Cloud Architect",
      department: "Core Systems Architecture",
      employeeCode: "EMP-94021",
      emergencyContact: "+1 (555) 234-8901",
      dob: "19/07/1989",
      gender: "FEMALE",
      genderHi: "महिला",
      bloodGroup: "A+",
      idNumber: "APX-EMP-94021",
      doi: "15/02/2022",
      doe: "31/12/2028",
      isLifetime: false,
      hasQrCode: true,
      hasBarcode: true,
      hasSmartChip: true,
      hasHologram: true,
      hasGuilloche: true,
      finish: "glossy",
      lightAngle: 50,
      plasticSheen: 55,
      photoUrl: "/repo-assets/images/people/female_generic.png",
    },
  },
  {
    key: "loyalty-card",
    name: "Loyalty & VIP Club Card",
    category: "Institutional & Membership Cards",
    badge: "VIP Club",
    description: "Obsidian metallic VIP membership card with gold embossed 16-digit card number, tier badge, valid thru, and scannable QR.",
    permanentDescription: "Permanent: Obsidian brushed metal texture, gold foil accents, VIP security crest, and magnetic stripe strip.",
    defaultBackground: "",
    defaultLayers: LOYALTY_DEFAULT_LAYERS,
    defaultData: {
      cardType: "loyalty-card",
      cardTitle: "OBSIDIAN PREMIER CLUB",
      cardTitleHi: "ऑब्सिडियन क्लब",
      subtitle: "Exclusive Global Concierge & Privileges",
      tagline: "By Invitation Only",
      emblemType: "vip",
      nameEn: "ALEXANDER WRIGHT",
      nameHi: "अलेक्जेंडर राइट",
      membershipTier: "PLATINUM VIP MEMBER",
      pointsBalance: "248,500 PTS",
      idNumber: "5412  8904  3321  9820",
      doi: "01/01/2024",
      doe: "12/29",
      isLifetime: false,
      hasQrCode: true,
      hasBarcode: false,
      hasSmartChip: true,
      hasHologram: true,
      hasGuilloche: true,
      finish: "glossy",
      lightAngle: 75,
      plasticSheen: 70,
    },
  },
  {
    key: "library-card",
    name: "Library Membership Card",
    category: "Institutional & Membership Cards",
    badge: "Library",
    description: "Scholarly library membership card featuring member ID, book checkout limits, barcode, and automated catalog QR.",
    permanentDescription: "Permanent: Central Academic Library crest, book checkout policy, circulation desk barcode, and library rules.",
    defaultBackground: "",
    defaultLayers: LIBRARY_DEFAULT_LAYERS,
    defaultData: {
      cardType: "library-card",
      cardTitle: "CENTRAL ACADEMIC LIBRARY",
      cardTitleHi: "केंद्रीय शैक्षणिक पुस्तकालय",
      subtitle: "Metropolitan Research & Archives System",
      tagline: "Knowledge, Research & Preservation",
      emblemType: "academic",
      nameEn: "ELENA ROSTOVA",
      nameHi: "एलेना रोस्तोवा",
      libraryLimit: "5 Books / 30 Days Circulation",
      dob: "03/11/1997",
      gender: "FEMALE",
      genderHi: "महिला",
      idNumber: "LIB-2026-88402",
      doi: "10/01/2024",
      doe: "09/01/2027",
      isLifetime: false,
      hasQrCode: true,
      hasBarcode: true,
      hasSmartChip: false,
      hasHologram: false,
      hasGuilloche: true,
      finish: "matte",
      lightAngle: 30,
      plasticSheen: 25,
      photoUrl: "/repo-assets/images/people/female_generic.png",
    },
  },
];

// Generate Real-Time Dynamic QR Code data URL with authentic payload
export async function generateCardQrCodeUrl(data: CardSectionData): Promise<string> {
  let content = "";
  if (data.cardType.includes("pan")) {
    content = `PAN:${data.idNumber.replace(/\s+/g, "")}|NAME:${data.nameEn}|FATHER:${data.fatherNameEn}|DOB:${data.dob}|STATUS:OPERATIVE|ISSUER:INCOME_TAX_DEPARTMENT_INDIA`;
  } else if (data.cardType.includes("aadhaar")) {
    content = `<?xml version="1.0" encoding="UTF-8"?><PrintLetterBarcodeData uid="${data.idNumber.replace(/\s+/g, "")}" name="${data.nameEn}" gender="${data.gender.charAt(0)}" yob="${data.dob.split("/")[2] || "1992"}" co="${data.fatherNameEn}" dist="Bengaluru" state="Karnataka" pc="${data.pinCode || "560038"}" dob="${data.dob}"/>`;
  } else if (data.cardType.includes("driving")) {
    content = `DL:${data.idNumber}|HOLDER:${data.nameEn}|DOB:${data.dob}|DOI:${data.doi}|EXP:${data.doe}|COV:${data.vehicleClasses}|BG:${data.bloodGroup}|AUTH:DELHI_TRANSPORT`;
  } else if (data.cardType.includes("voter")) {
    content = `EPIC_NO:${data.idNumber}|NAME:${data.nameEn}|RELATION:${data.fatherNameEn}|DOB:${data.dob}|GENDER:${data.gender}|STATE:S25|AC:142`;
  } else if (data.cardType === "student-card") {
    content = `STUDENT_ID:${data.idNumber}|NAME:${data.nameEn}|ROLL:${data.studentRollNo}|COURSE:${data.courseDegree}|BATCH:${data.academicYear}|INSTITUTION:${data.cardTitle}`;
  } else if (data.cardType === "employee-card") {
    content = `EMP_BADGE:${data.idNumber}|NAME:${data.nameEn}|ROLE:${data.designation}|DEPT:${data.department}|EMERGENCY:${data.emergencyContact}|COMPANY:${data.cardTitle}`;
  } else if (data.cardType === "loyalty-card") {
    content = `VIP_MEMBER:${data.idNumber}|HOLDER:${data.nameEn}|TIER:${data.membershipTier}|POINTS:${data.pointsBalance}|VALID_THRU:${data.doe}`;
  } else {
    content = `LIBRARY_CARD:${data.idNumber}|MEMBER:${data.nameEn}|LIMIT:${data.libraryLimit}|EXPIRY:${data.doe}|SYSTEM:${data.cardTitle}`;
  }

  try {
    return await QRCode.toDataURL(content, {
      errorCorrectionLevel: "M",
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      width: 400,
    });
  } catch (err) {
    console.error("QR Code generation failed:", err);
    return "";
  }
}

// Generate Realistic Valid IDs with correct formats
export function generateRealisticIdNumber(cardType: CardTypeKey): string {
  const getRandomChars = (chars: string, len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

  if (cardType === "pan-latest") {
    const alphas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    return `${getRandomChars(alphas, 3)}P${getRandomChars(alphas, 1)}${Math.floor(1000 + Math.random() * 9000)}${getRandomChars(alphas, 1)}`;
  }
  if (cardType.includes("aadhaar")) {
    const p1 = Math.floor(2000 + Math.random() * 7999);
    const p2 = Math.floor(1000 + Math.random() * 8999);
    const p3 = Math.floor(1000 + Math.random() * 8999);
    return `${p1} ${p2} ${p3}`;
  }
  if (cardType === "driving-license") {
    const states = ["DL", "MH", "KA", "TN", "UP", "GJ", "RJ"];
    const st = states[Math.floor(Math.random() * states.length)];
    const rto = String(Math.floor(1 + Math.random() * 20)).padStart(2, "0");
    const year = Math.floor(2014 + Math.random() * 10);
    const serial = String(Math.floor(1000000 + Math.random() * 8999999));
    return `${st}-${rto}${year}${serial}`;
  }
  if (cardType === "voter-id") {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const p1 = getRandomChars(letters, 3);
    const p2 = Math.floor(1000000 + Math.random() * 8999999);
    return `${p1}${p2}`;
  }
  if (cardType === "student-card") {
    return `NIT-CS-2024-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (cardType === "employee-card") {
    return `APX-EMP-${Math.floor(10000 + Math.random() * 89999)}`;
  }
  if (cardType === "loyalty-card") {
    const c1 = Math.floor(4000 + Math.random() * 5999);
    const c2 = Math.floor(1000 + Math.random() * 8999);
    const c3 = Math.floor(1000 + Math.random() * 8999);
    const c4 = Math.floor(1000 + Math.random() * 8999);
    return `${c1}  ${c2}  ${c3}  ${c4}`;
  }
  return `LIB-2026-${Math.floor(10000 + Math.random() * 89999)}`;
}

// Convert CardSectionData into Photoshop PSD using exact layer coordinates
export function buildCardPsdDocument(card: CardSectionData): Uint8Array {
  const width = 1012;
  const height = 638;
  const layers: PsdLayerItem[] = [];

  // 1. Background layer
  layers.push({
    id: "layer_background",
    name: "Card Background Template",
    type: "shape",
    left: 0,
    top: 0,
    width,
    height,
    opacity: 1,
    visible: true,
  });

  // 2. Add each calibrated layer from the card
  card.layers.forEach((l) => {
    if (!l.visible) return;

    const left = Math.round((l.x / 100) * width);
    const top = Math.round((l.y / 100) * height);
    const w = l.width ? Math.round((l.width / 100) * width) : 200;
    const h = l.height ? Math.round((l.height / 100) * height) : 50;

    if (l.type === "text") {
      let textVal = "";
      if (l.dataKey && card[l.dataKey]) {
        textVal = String(card[l.dataKey]);
      } else {
        textVal = l.name;
      }
      if (l.prefix) textVal = `${l.prefix}${textVal}`;
      if (l.uppercase) textVal = textVal.toUpperCase();

      layers.push({
        id: `layer_${l.id}`,
        name: l.name,
        type: "text",
        left,
        top,
        width: w || 400,
        height: h || 40,
        opacity: l.opacity ?? 1,
        visible: l.visible,
        text: textVal,
        fontSize: l.fontSize || 22,
        fontFamily: l.fontFamily?.includes("Verdana") ? "Verdana" : "Arial",
        fontColor: l.color || "#0f172a",
        textAlign: l.textAlign || "left",
      });
    } else if (l.type === "image") {
      layers.push({
        id: `layer_${l.id}`,
        name: l.name,
        type: "image",
        left,
        top,
        width: w,
        height: h,
        opacity: l.opacity ?? 1,
        visible: l.visible,
        imageDataUrl: card.photoUrl,
      });
    } else if (l.type === "qr") {
      layers.push({
        id: `layer_${l.id}`,
        name: l.name,
        type: "image",
        left,
        top,
        width: w,
        height: h,
        opacity: l.opacity ?? 1,
        visible: l.visible,
      });
    } else if (l.type === "signature" && card.signatureUrl) {
      layers.push({
        id: `layer_${l.id}`,
        name: l.name,
        type: "image",
        left,
        top,
        width: w,
        height: h,
        opacity: l.opacity ?? 1,
        visible: l.visible,
        imageDataUrl: card.signatureUrl,
      });
    }
  });

  const doc: PsdDocumentData = {
    name: `${card.cardType}_${card.idNumber.replace(/\s+/g, "")}.psd`,
    width,
    height,
    layers,
  };

  return generatePsdUint8Array(doc);
}

// 1-Click Super Admin Personas
export const SUPER_ADMIN_PERSONAS = [
  {
    name: "Dr. Priya Verma",
    role: "NSDL PAN Card Holder",
    presetKey: "pan-latest" as CardTypeKey,
    data: {
      nameEn: "PRIYA VERMA",
      nameHi: "प्रिया वर्मा",
      fatherNameEn: "SURESH VERMA",
      fatherNameHi: "सुरेश वर्मा",
      dob: "22/11/1995",
      gender: "FEMALE" as const,
      genderHi: "महिला",
      idNumber: "ABCDE1234F",
      photoUrl: "/repo-assets/images/people/female_generic.png",
    },
  },
  {
    name: "Aarav Sharma",
    role: "UIDAI Resident",
    presetKey: "aadhaar-front" as CardTypeKey,
    data: {
      nameEn: "Aarav Sharma",
      nameHi: "आरव शर्मा",
      fatherNameEn: "Rajesh Sharma",
      fatherNameHi: "राजेश शर्मा",
      dob: "15/08/1992",
      gender: "MALE" as const,
      genderHi: "पुरुष",
      idNumber: "4521 8904 1238",
      photoUrl: "/repo-assets/images/people/male_generic.jpg",
    },
  },
  {
    name: "Vikram Choudhary",
    role: "RTO Transport Licensed Driver",
    presetKey: "driving-license" as CardTypeKey,
    data: {
      nameEn: "VIKRAM CHOUDHARY",
      nameHi: "विक्रम चौधरी",
      fatherNameEn: "MAHENDRA CHOUDHARY",
      fatherNameHi: "महेन्द्र चौधरी",
      dob: "08/04/1988",
      gender: "MALE" as const,
      genderHi: "पुरुष",
      bloodGroup: "B+",
      idNumber: "DL-0420190048291",
      doi: "12/06/2019",
      doe: "11/06/2039",
      vehicleClasses: "MCWG, LMV",
      photoUrl: "/repo-assets/images/people/male_generic.jpg",
    },
  },
  {
    name: "Sunita Devi",
    role: "ECI Elector / Voter",
    presetKey: "voter-id" as CardTypeKey,
    data: {
      nameEn: "SUNITA DEVI",
      nameHi: "सुनीता देवी",
      fatherNameEn: "W/O: RAMESHWAR PRASAD",
      fatherNameHi: "पति: रामेश्वर प्रसाद",
      dob: "05/10/1985",
      gender: "FEMALE" as const,
      genderHi: "महिला",
      idNumber: "WBK2948210",
      photoUrl: "/repo-assets/images/people/female_generic.png",
    },
  },
  {
    name: "Rahul Meche",
    role: "University Student",
    presetKey: "student-card" as CardTypeKey,
    data: {
      nameEn: "RAHUL MECHE",
      nameHi: "राहुल मेचे",
      studentRollNo: "NIT/2024/CS-8402",
      courseDegree: "B.Tech (Computer Science)",
      department: "School of Computing",
      academicYear: "2024 - 2028",
      dob: "14/06/2004",
      bloodGroup: "O+",
      idNumber: "NIT-CS-2024-8402",
      photoUrl: "/repo-assets/images/people/male_generic.jpg",
    },
  },
  {
    name: "Sarah Connor",
    role: "Enterprise Cloud Architect",
    presetKey: "employee-card" as CardTypeKey,
    data: {
      nameEn: "SARAH CONNOR",
      nameHi: "सारा कॉनर",
      designation: "Principal Cloud Architect",
      department: "Core Systems Architecture",
      employeeCode: "EMP-94021",
      emergencyContact: "+1 (555) 234-8901",
      bloodGroup: "A+",
      idNumber: "APX-EMP-94021",
      photoUrl: "/repo-assets/images/people/female_generic.png",
    },
  },
  {
    name: "Alexander Wright",
    role: "VIP Platinum Club Member",
    presetKey: "loyalty-card" as CardTypeKey,
    data: {
      nameEn: "ALEXANDER WRIGHT",
      nameHi: "अलेक्जेंडर राइट",
      membershipTier: "PLATINUM VIP MEMBER",
      pointsBalance: "248,500 PTS",
      idNumber: "5412  8904  3321  9820",
      doe: "12/29",
    },
  },
  {
    name: "Elena Rostova",
    role: "Academic Library Scholar",
    presetKey: "library-card" as CardTypeKey,
    data: {
      nameEn: "ELENA ROSTOVA",
      nameHi: "एलेना रोस्तोवा",
      libraryLimit: "5 Books / 30 Days Circulation",
      idNumber: "LIB-2026-88402",
      doe: "09/01/2027",
      photoUrl: "/repo-assets/images/people/female_generic.png",
    },
  },
];

/**
 * Returns the exact calibrated official PP (Passport Photo) placement and dimensions
 * for each document type, matching the authentic government template standards.
 */
export function getOfficialPhotoPlacement(cardType: CardTypeKey): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const preset = CARD_PRESETS.find((p) => p.key === cardType);
  if (preset) {
    const photoLayer = preset.defaultLayers.find((l) => l.id === "photo" || l.type === "image");
    if (photoLayer) {
      return {
        x: photoLayer.x,
        y: photoLayer.y,
        width: photoLayer.width ?? 20,
        height: photoLayer.height ?? 38,
      };
    }
  }

  // Fallback official standard CR-80 portrait location
  switch (cardType) {
    case "pan-latest":
      return { x: 77.4, y: 41.5, width: 17.5, height: 35.5 };
    case "driving-license":
      return { x: 73.6, y: 20.2, width: 21.5, height: 43.5 };
    case "aadhaar-front":
      return { x: 3.4, y: 24.5, width: 29.5, height: 37.2 };
    case "voter-id":
      return { x: 6.0, y: 24.5, width: 22.0, height: 42.0 };
    case "student-card":
    case "employee-card":
      return { x: 5.5, y: 26.0, width: 22.0, height: 46.0 };
    case "loyalty-card":
      return { x: 78.0, y: 28.0, width: 16.0, height: 34.0 };
    case "library-card":
    default:
      return { x: 6.0, y: 26.0, width: 21.0, height: 45.0 };
  }
}

/**
 * Returns the immutable official calibrated layer configurations for each card type.
 * Used to guarantee that editable letters, text, and barcodes are locked to their real positions.
 */
export function getOfficialPresetLayers(cardType: CardTypeKey): CardLayerConfig[] {
  const preset = CARD_PRESETS.find((p) => p.key === cardType);
  if (preset) {
    return JSON.parse(JSON.stringify(preset.defaultLayers));
  }
  return [];
}

