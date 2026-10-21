import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBackendMediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2080/api';
  const backendOrigin = apiBase.replace(/\/api(\/.*)?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${backendOrigin}${cleanPath}`;
}

