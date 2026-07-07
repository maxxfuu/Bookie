import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Signed values: positive renders green, negative rose, zero default. */
export const positiveClass = "text-green-500 dark:text-green-400"
export const negativeClass = "text-rose-500 dark:text-rose-400"

export function signedClass(value: number) {
  if (value > 0) return positiveClass
  if (value < 0) return negativeClass
  return undefined
}
