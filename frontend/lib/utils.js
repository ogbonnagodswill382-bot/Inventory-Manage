import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function productStatus(p) {
  if (!p) return "in_stock";
  if (p.status) return p.status;
  if (p.stock === 0) return "out_of_stock";
  if (p.stock <= (p.threshold || 10)) return "low_stock";
  return "in_stock";
}
