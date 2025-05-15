import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const APP_VERSION = '0.1.0a';

// Security: Sanitize user input
export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '');
}

// Security: Validate file size and type
export function validateFile(file: File, maxSize: number = 5242880): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return file.size <= maxSize && allowedTypes.includes(file.type);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate cryptographically secure profile ID
export function generateProfileId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let result = '';
  const crypto = window.crypto || window.msCrypto;
  const values = new Uint32Array(12);
  crypto.getRandomValues(values);
  
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(values[i] % chars.length);
  }
  return result;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export const COUNTRIES = [
  { value: 'usa', label: 'United States' },
  { value: 'india', label: 'India' },
  { value: 'uk', label: 'United Kingdom' }
] as const;

export const OCCASIONS = [
  { value: 'office', label: 'Office' },
  { value: 'party', label: 'Party' },
  { value: 'casual', label: 'Casual' },
  { value: 'wedding', label: 'Wedding' }
] as const;

export const SKIN_TONES = [
  { value: 'fair', label: 'Fair' },
  { value: 'wheatish', label: 'Wheatish' },
  { value: 'brown', label: 'Brown' },
  { value: 'intense_dark', label: 'Intense Dark' },
] as const;

export const UNDERTONES = [
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'neutral', label: 'Neutral' },
] as const;

export const BODY_SHAPES = {
  male: [
    { value: 'rectangle', label: 'Rectangle - Equal shoulders, waist, and hips' },
    { value: 'triangle', label: 'Triangle - Shoulders narrower than waist/hips' },
    { value: 'inverted_triangle', label: 'Inverted Triangle - Shoulders wider than waist/hips' },
    { value: 'oval', label: 'Oval - Waist wider than shoulders/hips' },
    { value: 'trapezoid', label: 'Trapezoid - Shoulders > Waist > Hips (balanced proportion)' },
  ],
  female: [
    { value: 'hourglass', label: 'Hourglass - Bust and hips equal, with a smaller waist' },
    { value: 'pear', label: 'Pear/Triangle - Hips wider than bust/shoulders' },
    { value: 'apple', label: 'Apple/Inverted Triangle - Bust/shoulders wider than hips' },
    { value: 'rectangle', label: 'Rectangle - Bust, waist, and hips equal' },
    { value: 'spoon', label: 'Spoon - Defined hip curve, wider hips' },
    { value: 'diamond', label: 'Diamond - Waist wider than bust/hips' },
    { value: 'oval', label: 'Oval - Rounded shape with a larger bust and stomach' },
  ],
} as const;

// Format currency with validation
export function formatCurrency(amount: number | string, currency = 'INR'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount) || !isFinite(numAmount)) return 'Invalid amount';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date with validation
export function formatDate(date: string | Date): string {
  const parsedDate = date instanceof Date ? date : new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Invalid date';
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate);
}

// Type-safe debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { maxWait?: number } = {}
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  
  return function(...args: Parameters<T>): void {
    if (timeout) clearTimeout(timeout);
    if (maxTimeoutId && options.maxWait) clearTimeout(maxTimeoutId);
    
    const now = Date.now();
    lastCallTime = now;
    
    timeout = setTimeout(() => func(...args), wait);
    
    if (options.maxWait) {
      maxTimeoutId = setTimeout(() => {
        if (Date.now() - lastCallTime >= (options.maxWait || 0)) {
          if (timeout) clearTimeout(timeout);
          func(...args);
        }
      }, options.maxWait);
    }
  };
}