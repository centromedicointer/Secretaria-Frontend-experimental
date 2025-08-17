import { z } from "zod";

// Input sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .slice(0, 1000); // Limit length
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone
    .replace(/[^\d+\-\(\)\s]/g, '') // Only allow digits, +, -, (), and spaces
    .trim()
    .slice(0, 20);
};

export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
};

// Validation schemas
export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Full name can only contain letters, spaces, apostrophes, and hyphens')
});

export const n8nConnectionSchema = z.object({
  baseUrl: z
    .string()
    .min(1, 'Base URL is required')
    .url('Please enter a valid URL')
    .refine(url => url.startsWith('https://') || url.startsWith('http://'), 'URL must include protocol (http:// or https://)')
    .transform(sanitizeUrl),
  apiKey: z
    .string()
    .min(10, 'API Key must be at least 10 characters')
    .max(500, 'API Key is too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'API Key contains invalid characters'),
  workflowId: z
    .string()
    .optional()
    .refine(id => !id || /^[a-zA-Z0-9_-]+$/.test(id), 'Workflow ID contains invalid characters')
});

export const phoneSearchSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long')
    .transform(sanitizePhoneNumber)
    .refine(phone => /^[\d+\-\(\)\s]+$/.test(phone), 'Invalid phone number format')
});

export const eventSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long')
    .transform(sanitizeInput),
  description: z
    .string()
    .max(1000, 'Description is too long')
    .transform(sanitizeInput)
    .optional(),
  date: z
    .date()
    .min(new Date(), 'Date must be in the future'),
  attendees: z
    .array(z.string().email('Invalid email format'))
    .optional()
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type N8nConnectionFormData = z.infer<typeof n8nConnectionSchema>;
export type PhoneSearchFormData = z.infer<typeof phoneSearchSchema>;
export type EventFormData = z.infer<typeof eventSchema>;