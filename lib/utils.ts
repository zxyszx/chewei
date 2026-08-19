import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function publicId(slug: string, slotNumber: number) {
  return `${slug.slice(0, 3).toUpperCase()}-${String(slotNumber).padStart(3, "0")}`;
}

export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
