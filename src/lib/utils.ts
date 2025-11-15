import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric"
}) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", options);
}
