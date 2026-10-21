import * as z from "zod";

export const addonGroupSchema = z.object({
  name: z.object({
    ar: z.string().min(2, "الاسم بالعربية مطلوب (حرفين على الأقل)"),
    en: z.string().min(2, "الاسم بالإنجليزية مطلوب (حرفين على الأقل)"),
  }),
  description: z.object({
    ar: z.string().optional().nullable(),
    en: z.string().optional().nullable(),
  }).optional(),
  input_type: z.enum(["checkbox", "radio"]),
  is_required: z.boolean().default(false),
  price_multiplier_type: z.enum(["per_item", "per_order_line"]),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export type AddonGroupFormValues = z.infer<typeof addonGroupSchema>;

export const productAddonSchema = z.object({
  name: z.object({
    ar: z.string().min(2, "الاسم بالعربية مطلوب (حرفين على الأقل)"),
    en: z.string().min(2, "الاسم بالإنجليزية مطلوب (حرفين على الأقل)"),
  }),
  description: z.object({
    ar: z.string().optional().nullable(),
    en: z.string().optional().nullable(),
  }).optional(),
  type: z.enum(["simple", "printing_linked"]),
  price: z.coerce.number().min(0, "السعر يجب أن يكون رقماً إيجابياً"),
  price_type: z.enum(["fixed", "percentage"]),
  printing_type_id: z.string().optional().nullable(),
  requires_upload: z.boolean().default(false),
  allow_multiple_uploads: z.boolean().default(false),
  max_uploads: z.coerce.number().int().min(1).default(1),
  track_inventory: z.boolean().default(false),
  quantity: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
}).superRefine((data, ctx) => {
  if (data.type === 'printing_linked' && !data.printing_type_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "يجب اختيار نوع الطباعة",
      path: ["printing_type_id"],
    });
  }
  
  if (data.price_type === 'percentage' && data.price > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "النسبة المئوية لا يمكن أن تتجاوز 100%",
      path: ["price"],
    });
  }
});

export type ProductAddonFormValues = z.infer<typeof productAddonSchema>;
