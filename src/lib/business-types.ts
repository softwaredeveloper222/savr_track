export interface ComplianceItem {
  title: string;
  category: string;
  isRecurring: boolean;
  recurringMonths: number | null;
  description: string;
}

export interface BusinessType {
  value: string;
  label: string;
  description: string;
  complianceItems: ComplianceItem[];
}

export const BUSINESS_TYPES: BusinessType[] = [
  {
    value: "hvac",
    label: "HVAC",
    description: "Heating, ventilation, and air conditioning",
    complianceItems: [
      { title: "EPA 608 Certification", category: "certification", isRecurring: false, recurringMonths: null, description: "Required for handling refrigerants" },
      { title: "HVAC Contractor License", category: "trade_license", isRecurring: true, recurringMonths: 12, description: "State contractor license for HVAC work" },
      { title: "Refrigerant Handling License", category: "trade_license", isRecurring: true, recurringMonths: 12, description: "License to purchase and handle refrigerants" },
      { title: "General Liability Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "General liability coverage" },
      { title: "Workers Compensation Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Workers comp coverage for employees" },
      { title: "Mechanical Permit", category: "permit", isRecurring: false, recurringMonths: null, description: "Permit for mechanical installations" },
      { title: "Business License", category: "business_license", isRecurring: true, recurringMonths: 12, description: "General business operating license" },
      { title: "Vehicle Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Commercial vehicle insurance" },
      { title: "OSHA Safety Training", category: "safety_training", isRecurring: true, recurringMonths: 12, description: "Annual OSHA safety training compliance" },
      { title: "Bonding Certificate", category: "certification", isRecurring: true, recurringMonths: 12, description: "Surety bond for contractor work" },
    ],
  },
  {
    value: "electrical",
    label: "Electrical",
    description: "Electrical contracting and services",
    complianceItems: [
      { title: "Journeyman Electrician License", category: "trade_license", isRecurring: true, recurringMonths: 24, description: "State journeyman electrician license" },
      { title: "Master Electrician License", category: "trade_license", isRecurring: true, recurringMonths: 24, description: "State master electrician license" },
      { title: "Electrical Contractor License", category: "trade_license", isRecurring: true, recurringMonths: 12, description: "State electrical contractor license" },
      { title: "Electrical Permit", category: "permit", isRecurring: false, recurringMonths: null, description: "Permit for electrical work" },
      { title: "General Liability Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "General liability coverage" },
      { title: "Workers Compensation Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Workers comp coverage" },
      { title: "Bonding Certificate", category: "certification", isRecurring: true, recurringMonths: 12, description: "Surety bond" },
      { title: "Business License", category: "business_license", isRecurring: true, recurringMonths: 12, description: "General business operating license" },
      { title: "OSHA Safety Training", category: "safety_training", isRecurring: true, recurringMonths: 12, description: "Annual OSHA safety training" },
      { title: "Arc Flash Safety Certification", category: "safety_training", isRecurring: true, recurringMonths: 12, description: "NFPA 70E arc flash training" },
    ],
  },
  {
    value: "plumbing",
    label: "Plumbing",
    description: "Plumbing contracting and services",
    complianceItems: [
      { title: "Plumbing Contractor License", category: "trade_license", isRecurring: true, recurringMonths: 12, description: "State plumbing contractor license" },
      { title: "Master Plumber License", category: "trade_license", isRecurring: true, recurringMonths: 24, description: "State master plumber license" },
      { title: "Journeyman Plumber License", category: "trade_license", isRecurring: true, recurringMonths: 24, description: "State journeyman plumber license" },
      { title: "Plumbing Permit", category: "permit", isRecurring: false, recurringMonths: null, description: "Permit for plumbing work" },
      { title: "General Liability Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "General liability coverage" },
      { title: "Workers Compensation Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Workers comp coverage" },
      { title: "Backflow Prevention Certification", category: "certification", isRecurring: true, recurringMonths: 12, description: "Backflow preventer testing certification" },
      { title: "Business License", category: "business_license", isRecurring: true, recurringMonths: 12, description: "General business operating license" },
      { title: "Bonding Certificate", category: "certification", isRecurring: true, recurringMonths: 12, description: "Surety bond" },
      { title: "OSHA Safety Training", category: "safety_training", isRecurring: true, recurringMonths: 12, description: "Annual OSHA safety training" },
    ],
  },
  {
    value: "general_contractor",
    label: "General Contractor",
    description: "General construction and building",
    complianceItems: [
      { title: "General Contractor License", category: "trade_license", isRecurring: true, recurringMonths: 12, description: "State general contractor license" },
      { title: "General Liability Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "General liability coverage" },
      { title: "Workers Compensation Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Workers comp coverage" },
      { title: "Builder's Risk Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Insurance for active construction projects" },
      { title: "Business License", category: "business_license", isRecurring: true, recurringMonths: 12, description: "General business operating license" },
      { title: "Building Permit", category: "permit", isRecurring: false, recurringMonths: null, description: "Building construction permit" },
      { title: "Bonding Certificate", category: "certification", isRecurring: true, recurringMonths: 12, description: "Surety bond for projects" },
      { title: "OSHA 30-Hour Training", category: "safety_training", isRecurring: false, recurringMonths: null, description: "OSHA 30-hour construction safety" },
      { title: "Certificate of Insurance (COI)", category: "coi", isRecurring: true, recurringMonths: 12, description: "Certificate of insurance for clients" },
      { title: "Annual Tax Filing", category: "tax", isRecurring: true, recurringMonths: 12, description: "Annual tax return deadline" },
      { title: "Vehicle Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Commercial vehicle insurance" },
    ],
  },
  {
    value: "roofing",
    label: "Roofing",
    description: "Roofing installation and repair",
    complianceItems: [
      { title: "Roofing Contractor License", category: "trade_license", isRecurring: true, recurringMonths: 12, description: "State roofing contractor license" },
      { title: "General Liability Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "General liability coverage" },
      { title: "Workers Compensation Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Workers comp coverage" },
      { title: "Roofing Permit", category: "permit", isRecurring: false, recurringMonths: null, description: "Permit for roofing work" },
      { title: "Business License", category: "business_license", isRecurring: true, recurringMonths: 12, description: "General business operating license" },
      { title: "Fall Protection Training", category: "safety_training", isRecurring: true, recurringMonths: 12, description: "OSHA fall protection training" },
      { title: "Bonding Certificate", category: "certification", isRecurring: true, recurringMonths: 12, description: "Surety bond" },
      { title: "Vehicle Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Commercial vehicle insurance" },
      { title: "Manufacturer Certification", category: "certification", isRecurring: true, recurringMonths: 12, description: "Certified installer for roofing manufacturer" },
    ],
  },
  {
    value: "painting",
    label: "Painting",
    description: "Painting and coatings contracting",
    complianceItems: [
      { title: "Painting Contractor License", category: "trade_license", isRecurring: true, recurringMonths: 12, description: "State painting contractor license" },
      { title: "EPA Lead-Safe Certification (RRP)", category: "certification", isRecurring: true, recurringMonths: 60, description: "EPA renovation, repair, and painting rule certification" },
      { title: "General Liability Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "General liability coverage" },
      { title: "Workers Compensation Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Workers comp coverage" },
      { title: "Business License", category: "business_license", isRecurring: true, recurringMonths: 12, description: "General business operating license" },
      { title: "OSHA Safety Training", category: "safety_training", isRecurring: true, recurringMonths: 12, description: "Annual OSHA safety training" },
      { title: "Vehicle Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Commercial vehicle insurance" },
    ],
  },
  {
    value: "landscaping",
    label: "Landscaping",
    description: "Landscaping and lawn care services",
    complianceItems: [
      { title: "Landscaping Contractor License", category: "trade_license", isRecurring: true, recurringMonths: 12, description: "State landscaping contractor license" },
      { title: "Pesticide Applicator License", category: "trade_license", isRecurring: true, recurringMonths: 12, description: "License for pesticide application" },
      { title: "General Liability Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "General liability coverage" },
      { title: "Workers Compensation Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Workers comp coverage" },
      { title: "Business License", category: "business_license", isRecurring: true, recurringMonths: 12, description: "General business operating license" },
      { title: "Vehicle Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Commercial vehicle insurance" },
      { title: "Irrigation License", category: "trade_license", isRecurring: true, recurringMonths: 24, description: "Irrigation system installation license" },
    ],
  },
  {
    value: "fire_protection",
    label: "Fire Protection",
    description: "Fire alarm, sprinkler, and suppression systems",
    complianceItems: [
      { title: "Fire Protection Contractor License", category: "trade_license", isRecurring: true, recurringMonths: 12, description: "State fire protection contractor license" },
      { title: "NICET Certification", category: "certification", isRecurring: true, recurringMonths: 36, description: "National certification for fire protection" },
      { title: "Fire Alarm Installation Permit", category: "permit", isRecurring: false, recurringMonths: null, description: "Permit for fire alarm installation" },
      { title: "General Liability Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "General liability coverage" },
      { title: "Workers Compensation Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Workers comp coverage" },
      { title: "Business License", category: "business_license", isRecurring: true, recurringMonths: 12, description: "General business operating license" },
      { title: "Inspection Certification", category: "inspection", isRecurring: true, recurringMonths: 12, description: "Annual fire system inspection certification" },
      { title: "Bonding Certificate", category: "certification", isRecurring: true, recurringMonths: 12, description: "Surety bond" },
    ],
  },
  {
    value: "other",
    label: "Other",
    description: "Other contractor type not listed above",
    complianceItems: [
      { title: "Business License", category: "business_license", isRecurring: true, recurringMonths: 12, description: "General business operating license" },
      { title: "General Liability Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "General liability coverage" },
      { title: "Workers Compensation Insurance", category: "insurance", isRecurring: true, recurringMonths: 12, description: "Workers comp coverage" },
      { title: "Annual Tax Filing", category: "tax", isRecurring: true, recurringMonths: 12, description: "Annual tax return deadline" },
      { title: "OSHA Safety Training", category: "safety_training", isRecurring: true, recurringMonths: 12, description: "Annual OSHA safety training" },
    ],
  },
];

export function getBusinessType(value: string): BusinessType | undefined {
  return BUSINESS_TYPES.find((bt) => bt.value === value);
}

export function getBusinessTypeLabel(value: string): string {
  return BUSINESS_TYPES.find((bt) => bt.value === value)?.label || value;
}

export function getComplianceItemsForType(businessType: string): ComplianceItem[] {
  return getBusinessType(businessType)?.complianceItems || [];
}
