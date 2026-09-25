import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function flattenErrors(errors: any, parentKey = "") {
  const flattened: {
    name: string;
    message: string;
    type: string;
  }[] = [];

  for (const key in errors) {
    if (!errors.hasOwnProperty(key)) continue;

    const currentPath = parentKey ? `${parentKey}.${key}` : key;
    const error = errors[key];

    if (error && error.message) {
      flattened.push({
        name: currentPath,
        message: error.message,
        type: error.type,
      });
    } else if (typeof error === "object") {
      flattened.push(...flattenErrors(error, currentPath));
    }
  }

  return flattened;
}
