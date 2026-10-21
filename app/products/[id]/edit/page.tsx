"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "../../schema";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/services/products";
import { uploadService } from "@/lib/services/upload";
import toast from "react-hot-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PackageOpen, Sparkles, ArrowRight, Loader2 } from "lucide-react";

import {
  BasicInfoTab,
  PricingTab,
  InventoryTab,
  ImagesTab,
  SEOTab,
} from "../../_components/AddProductTabs";
import { VariantsTab } from "../../_components/VariantsTab";
import { AddonsTab } from "../../_components/AddonsTab";

// Helper to generate a URL-friendly slug
const generateSlug = (text: string) => {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-") 
    .replace(/[^\w\u0600-\u06FF0-9-]+/g, "") 
    .replace(/-+/g, "-"); 
    
  return slug || Date.now().toString();
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("basic");
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real categories and attributes
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.getCategories,
  });

  const { data: attributes = [], isLoading: isAttributesLoading } = useQuery({
    queryKey: ["attributes"],
    queryFn: productsApi.getAttributes,
  });

  // Fetch Product Data
  const { data: productData, isLoading: isProductLoading, error: productError } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.getProduct(productId),
    enabled: !!productId,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Prepare form data natively for React Hook Form (Solves async defaultValues issues)
  const mappedData = useMemo(() => {
    if (!productData) return undefined;
    return {
      name: productData.name,
      categoryId: (productData.category_id || productData.categoryId || productData.category?.id)?.toString() || "",
      type: productData.type as "simple" | "variable",
      price: productData.price !== null && productData.price !== undefined ? Number(productData.price) : 0,
      discountPrice: productData.discount_price !== null && productData.discount_price !== undefined ? Number(productData.discount_price) : undefined,
      sku: productData.sku || "",
      barcode: productData.barcode || "",
      description: productData.description || "",
      trackInventory: Boolean(productData.track_inventory),
      quantity: productData.quantity !== null && productData.quantity !== undefined ? Number(productData.quantity) : undefined,
      weight: productData.weight !== null && productData.weight !== undefined ? Number(productData.weight) : undefined,
      seoTitle: productData.seo_title || "",
      seoDescription: productData.seo_description || "",
      metaKeywords: productData.meta_keywords || "",
      canonicalUrl: productData.canonical_url || "",
      ogImage: productData.og_image || "",
      isIndexable: productData.is_indexable !== undefined ? Boolean(productData.is_indexable) : true,
      schemaMarkup: productData.schema_markup ? (typeof productData.schema_markup === 'string' ? productData.schema_markup : JSON.stringify(productData.schema_markup)) : "",
      images: productData.images || [],
      addonGroupIds: productData.addon_groups?.map((g: any) => g.id) || [],
      variants: productData.type === "variable" && Array.isArray(productData.variants)
        ? productData.variants.map((v: any) => ({
            id: v.id ? v.id.toString() : crypto.randomUUID(),
            name: v.name || "",
            price: v.price !== null && v.price !== undefined ? Number(v.price) : 0,
            discountPrice: v.discount_price !== null && v.discount_price !== undefined ? Number(v.discount_price) : undefined,
            sku: v.sku || "",
            trackInventory: Boolean(v.track_inventory),
            quantity: v.quantity !== null && v.quantity !== undefined ? Number(v.quantity) : undefined,
            attributes: Array.isArray(v.attributes) ? v.attributes.map((attr: any) => ({
              name: attr.name || "",
              value: attr.value || "",
            })) : [],
          }))
        : [],
    };
  }, [productData]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      type: "simple",
      price: 0,
      discountPrice: undefined,
      sku: "",
      barcode: "",
      trackInventory: true,
      quantity: undefined,
      weight: undefined,
      seoTitle: "",
      seoDescription: "",
      variants: [],
      images: [],
      addonGroupIds: [],
    },
    values: mappedData as ProductFormValues | undefined,
  });

  const productType = form.watch("type");

  // Keep existingImages synchronized
  useEffect(() => {
    if (productData) {
      setExistingImages(productData.images || []);
    }
  }, [productData]);

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading("جاري تحديث المنتج...");

    try {
      // 1. Upload NEW Images in Parallel safely
      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        const uploadPromises = files.map((file) => uploadService.uploadImage(file));
        const uploadResultsSettled = await Promise.allSettled(uploadPromises);
        
        const failedUploads = uploadResultsSettled.filter(r => r.status === "rejected");
        if (failedUploads.length > 0) {
          throw new Error("فشل رفع بعض الصور. يرجى المحاولة مرة أخرى.");
        }
        
        uploadedUrls = uploadResultsSettled
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
          .map(r => r.value?.url)
          .filter(Boolean) as string[];
      }

      // Merge existing images with new uploaded urls
      const finalImages = [...existingImages, ...uploadedUrls];

      // 2. Build backend payload
      const payload = {
        name: data.name,
        slug: generateSlug(data.name),
        description: data.description,
        category_id: data.categoryId ? Number(data.categoryId) : null,
        type: data.type,
        price: data.price,
        discount_price: data.discountPrice,
        sku: data.sku,
        barcode: data.barcode,
        track_inventory: data.trackInventory,
        quantity: data.trackInventory ? data.quantity : null,
        weight: data.weight,
        seo_title: data.seoTitle,
        seo_description: data.seoDescription,
        meta_keywords: data.metaKeywords,
        canonical_url: data.canonicalUrl,
        og_image: data.ogImage,
        is_indexable: data.isIndexable,
        schema_markup: data.schemaMarkup,
        images: finalImages,
        addon_group_ids: data.addonGroupIds,
        variants: data.type === "variable" ? data.variants?.map((v) => ({
          id: v.id && !v.id.includes('-') ? v.id : null, // send ID if it exists and isn't a UUID
          name: v.name,
          price: v.price,
          discount_price: v.discountPrice,
          sku: v.sku,
          track_inventory: v.trackInventory !== undefined ? v.trackInventory : true,
          quantity: v.quantity,
          attributes: v.attributes?.map((attr) => ({
            name: attr.name,
            value: attr.value,
          })),
        })) : [],
      };

      // 3. Submit to backend
      await productsApi.updateProduct(productId, payload);
      queryClient.invalidateQueries({ queryKey: ["product", productId] });

      toast.success("تم تحديث المنتج بنجاح!", { id: toastId });
      router.push("/products");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ غير متوقع", { id: toastId });
      
      if (error.info && error.info.errors) {
        const backendErrors = error.info.errors;
        Object.keys(backendErrors).forEach((key) => {
          const fieldMap: Record<string, any> = {
            category_id: "categoryId",
            discount_price: "discountPrice",
            track_inventory: "trackInventory",
            seo_title: "seoTitle",
            seo_description: "seoDescription",
          };
          const formKey = fieldMap[key] || key;
          form.setError(formKey, { type: "server", message: backendErrors[key][0] });
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State handling (No flickering)
  if (isProductLoading || isCategoriesLoading || isAttributesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">جاري تحميل بيانات المنتج...</p>
      </div>
    );
  }

  if (productError || !productData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <PackageOpen className="w-16 h-16 text-slate-300" />
        <p className="text-slate-500 font-medium">عذراً، لم نتمكن من العثور على المنتج المطلوب.</p>
        <Button onClick={() => router.push("/products")} variant="outline">
          العودة للمنتجات
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/products">
              <ArrowRight className="w-5 h-5 text-slate-500" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <PackageOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                تعديل المنتج
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold font-mono">
                  #{productData.id}
                </span>
              </h1>
              <p className="text-slate-500 mt-1 text-sm">{productData.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[60vh]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
          <TabsList className="w-full flex sm:flex-wrap gap-2 h-auto bg-transparent justify-start border-b border-slate-100 pb-4 mb-8 rounded-none overflow-x-auto custom-scrollbar no-scrollbar-on-mobile">
            <TabsTrigger value="basic" className="rounded-full px-5 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:text-slate-600 border border-slate-100 data-[state=active]:border-indigo-600 transition-all font-medium whitespace-nowrap">أساسي</TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-full px-5 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:text-slate-600 border border-slate-100 data-[state=active]:border-indigo-600 transition-all font-medium whitespace-nowrap">التسعير</TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-full px-5 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:text-slate-600 border border-slate-100 data-[state=active]:border-indigo-600 transition-all font-medium whitespace-nowrap">المخزون</TabsTrigger>
            {productType === "variable" && (
              <TabsTrigger value="variants" className="rounded-full px-5 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:text-slate-600 border border-slate-100 data-[state=active]:border-indigo-600 transition-all font-medium whitespace-nowrap">المتغيرات</TabsTrigger>
            )}
            <TabsTrigger value="addons" className="rounded-full px-5 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:text-slate-600 border border-slate-100 data-[state=active]:border-indigo-600 transition-all font-medium whitespace-nowrap">الخدمات الإضافية</TabsTrigger>
            <TabsTrigger value="images" className="rounded-full px-5 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:text-slate-600 border border-slate-100 data-[state=active]:border-indigo-600 transition-all font-medium whitespace-nowrap">الصور</TabsTrigger>
            <TabsTrigger value="seo" className="rounded-full px-5 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:text-slate-600 border border-slate-100 data-[state=active]:border-indigo-600 transition-all font-medium whitespace-nowrap">SEO</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form id="product-form" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="max-w-4xl mx-auto">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <BasicInfoTab form={form as any} categories={categories} />
                </TabsContent>

                <TabsContent value="pricing" className="mt-0 h-full">
                  <PricingTab form={form as any} />
                </TabsContent>

                <TabsContent value="inventory" className="mt-0 h-full">
                  <InventoryTab form={form as any} />
                </TabsContent>

                {productType === "variable" && (
                  <TabsContent value="variants" className="mt-0">
                    <VariantsTab form={form as any} attributes={attributes} />
                  </TabsContent>
                )}

                <TabsContent value="addons" className="mt-0">
                  <AddonsTab form={form as any} />
                </TabsContent>

                <TabsContent value="images" className="mt-0">
                  <ImagesTab files={files} setFiles={setFiles} existingImages={existingImages} setExistingImages={setExistingImages} />
                </TabsContent>

                <TabsContent value="seo" className="mt-0">
                  <SEOTab form={form as any} />
                </TabsContent>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
        <Button type="button" variant="outline" asChild className="font-bold border-slate-200 text-slate-600 hover:bg-slate-50 px-8" disabled={isSubmitting}>
          <Link href="/products">إلغاء</Link>
        </Button>
        <Button type="submit" form="product-form" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 shadow-md hover:shadow-lg transition-all min-w-[140px]">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "حفظ التعديلات"}
        </Button>
      </div>
    </div>
  );
}
