import * as z from "zod";

const optionalNumber = z.preprocess((val): unknown => {
  if (val === "" || val === undefined || val === null) return undefined;
  const num = Number(val);
  return isNaN(num) ? val : num;
}, z.number({ message: "يجب إدخال رقم صحيح" }).min(0, "القيمة يجب أن تكون 0 أو أكثر").optional());

const requiredPrice = z.preprocess((val): unknown => {
  if (val === "" || val === undefined || val === null) return undefined;
  const num = Number(val);
  return isNaN(num) ? val : num;
}, z.number({ message: "السعر مطلوب ويجب إدخال رقم صحيح" }).min(0, "السعر يجب أن يكون 0 أو أكثر"));

export const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "التصنيف مطلوب"),
  type: z.enum(["simple", "variable"]),
  price: requiredPrice,
  discountPrice: optionalNumber,
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackInventory: z.boolean(),
  quantity: optionalNumber,
  weight: optionalNumber,
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  canonicalUrl: z.string().url("الرابط غير صحيح").optional().or(z.literal('')),
  ogImage: z.string().optional(),
  isIndexable: z.boolean().default(true),
  schemaMarkup: z.string().optional(),
  images: z.array(z.string()).optional(),
  addonGroupIds: z.array(z.coerce.number()).optional(),
  variants: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        attributes: z.array(
          z.object({
            name: z.string(),
            value: z.string(),
          })
        ).optional(),
        price: requiredPrice,
        discountPrice: optionalNumber,
        sku: z.string().optional(),
        trackInventory: z.boolean().optional(),
        quantity: optionalNumber,
      })
    )
    .optional(),
}).superRefine((data, ctx) => {
  if (data.discountPrice !== undefined && data.discountPrice >= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "سعر الخصم يجب أن يكون أقل من السعر الأساسي",
      path: ["discountPrice"],
    });
  }
  
  if (data.type === "variable" && (!data.variants || data.variants.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "يجب إضافة متغير واحد على الأقل للمنتج المتغير",
      path: ["variants"],
    });
  }

  if (data.trackInventory && data.quantity === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "الكمية مطلوبة عند تفعيل تتبع المخزون",
      path: ["quantity"],
    });
  }

  if (data.type === "variable" && data.variants && data.variants.length > 0) {
    data.variants.forEach((v, index) => {
      if (v.discountPrice !== undefined && v.discountPrice >= v.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "سعر الخصم يجب أن يكون أقل من السعر الأساسي",
          path: ["variants", index, "discountPrice"],
        });
      }
      if (v.trackInventory && v.quantity === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "الكمية مطلوبة عند تفعيل تتبع المخزون",
          path: ["variants", index, "quantity"],
        });
      }
    });
  }
});

export type ProductFormValues = z.infer<typeof productSchema>;

