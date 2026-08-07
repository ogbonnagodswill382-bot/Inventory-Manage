"use client";

import {
  Package,
  Boxes,
  Truck,
  Wrench,
  Hammer,
  Cog,
  Component,
  Zap,
  Layers,
  FileText,
  Folder,
  BookOpen,
  PenTool,
  Briefcase,
  Car,
  Pill,
  Sparkles,
  ShieldCheck,
  Cpu,
  BatteryCharging,
  Lightbulb,
  Armchair,
  Home,
  Grid,
  Shirt,
  ShoppingBag,
  Tag,
  Headphones,
  Smartphone,
  Laptop,
  Monitor,
  Watch,
  Coffee,
  Pizza,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Comprehensive Icon Map for all company product categories
export const PRODUCT_ICON_OPTIONS = [
  { label: "Default Package", value: "package", icon: Package },
  { label: "Boxes / Cargo", value: "boxes", icon: Boxes },
  { label: "Tools & Hardware", value: "wrench", icon: Wrench },
  { label: "Construction & Equipment", value: "hammer", icon: Hammer },
  { label: "Machine Parts & Gears", value: "cog", icon: Cog },
  { label: "Components & Spare Parts", value: "component", icon: Component },
  { label: "Materials & Layers", value: "layers", icon: Layers },
  { label: "Electrical & Power", value: "zap", icon: Zap },
  { label: "Microchips & Tech", value: "cpu", icon: Cpu },
  { label: "Batteries & Power Units", value: "battery", icon: BatteryCharging },
  { label: "Office Supplies & Paper", value: "filetext", icon: FileText },
  { label: "Stationery & Folders", value: "folder", icon: Folder },
  { label: "Books & Documents", value: "book", icon: BookOpen },
  { label: "Auto & Vehicles", value: "car", icon: Car },
  { label: "Logistics & Shipping", value: "truck", icon: Truck },
  { label: "Medical & Health", value: "pill", icon: Pill },
  { label: "Beauty & Cosmetics", value: "sparkles", icon: Sparkles },
  { label: "Safety & Protection", value: "shield", icon: ShieldCheck },
  { label: "Furniture & Decor", value: "furniture", icon: Armchair },
  { label: "Home & Hardware", value: "home", icon: Home },
  { label: "Lighting & Electrical", value: "light", icon: Lightbulb },
  { label: "Apparel & Textiles", value: "shirt", icon: Shirt },
  { label: "Retail & Shopping", value: "bag", icon: ShoppingBag },
  { label: "Tagged Item", value: "tag", icon: Tag },
];

const KEYWORD_ICON_MAP = {
  // Tools & Hardware
  tool: Wrench,
  wrench: Wrench,
  hammer: Hammer,
  drill: Hammer,
  screw: Wrench,
  hardware: Wrench,
  part: Component,
  component: Component,
  gear: Cog,
  machine: Cog,
  engine: Cog,
  motor: Cog,
  steel: Layers,
  metal: Layers,
  material: Layers,
  pipe: Layers,
  wire: Zap,
  cable: Zap,
  electric: Zap,
  power: Zap,
  battery: BatteryCharging,
  chip: Cpu,
  cpu: Cpu,
  // Logistics & Warehousing
  box: Boxes,
  crate: Boxes,
  pallet: Boxes,
  package: Package,
  cargo: Truck,
  shipping: Truck,
  delivery: Truck,
  truck: Truck,
  stock: Package,
  inventory: Package,
  // Office & Stationary
  paper: FileText,
  document: FileText,
  folder: Folder,
  file: Folder,
  book: BookOpen,
  pen: PenTool,
  office: Briefcase,
  stationary: FileText,
  // Auto & Spare Parts
  car: Car,
  auto: Car,
  vehicle: Car,
  tire: Car,
  wheel: Car,
  // Medical, Health & Beauty
  pill: Pill,
  medicine: Pill,
  pharma: Pill,
  health: ShieldCheck,
  safety: ShieldCheck,
  beauty: Sparkles,
  soap: Sparkles,
  cosmetic: Sparkles,
  // Furniture & Lighting
  chair: Armchair,
  table: Armchair,
  desk: Armchair,
  furniture: Armchair,
  lamp: Lightbulb,
  light: Lightbulb,
  bulb: Lightbulb,
  home: Home,
  // Apparel & Retail
  shirt: Shirt,
  cloth: Shirt,
  apparel: Shirt,
  textile: Shirt,
  bag: ShoppingBag,
  retail: ShoppingBag,
  tag: Tag,
  // Electronics
  headphone: Headphones,
  phone: Smartphone,
  mobile: Smartphone,
  laptop: Laptop,
  computer: Laptop,
  monitor: Monitor,
  display: Monitor,
  watch: Watch,
  coffee: Coffee,
  food: Pizza,
};

export function getProductIconComponent(name = "", categoryName = "", iconChoice = "") {
  // First check if iconChoice explicitly matches one of the values
  const chosen = PRODUCT_ICON_OPTIONS.find(o => o.value === iconChoice?.toLowerCase());
  if (chosen) return chosen.icon;

  // Otherwise smart keyword match against product name & category
  const str = `${name} ${categoryName} ${iconChoice}`.toLowerCase();

  for (const [key, Component] of Object.entries(KEYWORD_ICON_MAP)) {
    if (str.includes(key)) {
      return Component;
    }
  }

  return Package;
}

export function ProductIcon({ name, categoryName, emoji, className, iconClassName }) {
  const IconComponent = getProductIconComponent(name, categoryName, emoji);

  return (
    <div
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-semibold shadow-xs",
        className
      )}
    >
      <IconComponent className={cn("h-4 w-4", iconClassName)} />
    </div>
  );
}
