import * as z from 'zod';

export const printingProductTypeSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(255),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  allow_custom_name: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
});

export type PrintingProductTypeFormValues = z.infer<typeof printingProductTypeSchema>;
