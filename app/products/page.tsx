"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import CategoriesManager from "./_components/CategoriesManager";
import AttributesManager from "./_components/AttributesManager";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/services/products";
import toast from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";

import { Suspense, useState, useEffect } from "react";
import { DataTable } from "./_components/DataTable";
import { PaginationState } from "@tanstack/react-table";
import { useDebounce } from "@/hooks/useDebounce";

function ProductsPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category_id") || "all";

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: initialPage - 1, // react-table is 0-indexed
    pageSize: 15,
  });
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [categoryId, setCategoryId] = useState(initialCategory);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (pagination.pageIndex + 1).toString());
    if (debouncedSearchQuery) {
      params.set("search", debouncedSearchQuery);
    } else {
      params.delete("search");
    }
    if (categoryId && categoryId !== "all") {
      params.set("category_id", categoryId);
    } else {
      params.delete("category_id");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [pagination.pageIndex, debouncedSearchQuery, categoryId]);

  // Queries
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.getCategories,
  });

  const { data: attributes = [], isLoading: isAttributesLoading } = useQuery({
    queryKey: ["attributes"],
    queryFn: productsApi.getAttributes,
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products", pagination.pageIndex, debouncedSearchQuery, categoryId],
    queryFn: () => productsApi.getProducts({ 
      page: pagination.pageIndex + 1,
      search: debouncedSearchQuery,
      category_id: categoryId !== "all" ? categoryId : undefined
    }),
  });

  // Depending on Laravel backend pagination response structure
  const products = productsData?.data || productsData || [];
  const pageCount = productsData?.meta?.last_page || productsData?.last_page || -1;

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; parent_id: string | null; addon_group_ids?: number[] }) => productsApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("تم إضافة التصنيف بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة التصنيف"),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; parent_id: string | null; addon_group_ids?: number[] } }) => productsApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("تم التحديث بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("تم حذف التصنيف بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  const bulkDeleteCategoryMutation = useMutation({
    mutationFn: (ids: string[]) => productsApi.bulkDeleteCategories(ids),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      const blocked = response?.blocked || [];
      if (blocked.length === 0) {
        toast.success(`تم حذف ${response?.deleted_count || ''} تصنيف بنجاح`);
      } else {
        toast.success(`تم حذف ${response?.deleted_count || 0} تصنيف`);
        const reasons = blocked.map((b: any) => `• ${b.name}: ${b.reason}`).join('\n');
        toast.error(`لم يتم حذف ${blocked.length} تصنيف:\n${reasons}`, { duration: 8000 });
      }
    },
    onError: (error: any) => {
      const blocked = error?.info?.blocked || [];
      if (blocked.length > 0) {
        const reasons = blocked.map((b: any) => `• ${b.name}: ${b.reason}`).join('\n');
        toast.error(`لم يتم حذف أي تصنيف:\n${reasons}`, { duration: 8000 });
      } else {
        toast.error(error?.message || "حدث خطأ أثناء الحذف الجماعي");
      }
    },
  });

  // Attribute Mutations
  const createAttributeMutation = useMutation({
    mutationFn: (data: { name: string; values: string[] }) => productsApi.createAttribute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      toast.success("تم إضافة الخاصية بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة الخاصية"),
  });

  const updateAttributeMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: string[] }) => productsApi.updateAttribute(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      toast.success("تم التحديث بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });

  // Handlers
  const handleSaveCategory = (data: { name: string; parent_id: string | null; addon_group_ids?: number[] }, id?: string) => {
    if (id) {
      updateCategoryMutation.mutate({ id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategoryMutation.mutate(id);
  };

  const handleBulkDeleteCategories = (ids: string[]) => {
    bulkDeleteCategoryMutation.mutate(ids);
  };

  const handleAddAttribute = (name: string, initialValues: string[]) => {
    createAttributeMutation.mutate({ name, values: initialValues });
  };

  const handleDeleteAttribute = (id: string) => {
    // Backend API doesn't support attribute deletion yet in routes
    toast.error("حذف المتغيرات غير مدعوم حالياً من الخادم");
  };

  const handleAddValueToAttribute = (attrId: string, value: string) => {
    const attr = attributes.find((a: any) => a.id === attrId || a.id.toString() === attrId);
    if (!attr) return;
    const newValues = attr.values.includes(value) ? attr.values : [...attr.values, value];
    updateAttributeMutation.mutate({ id: attrId, values: newValues });
  };

  const handleRemoveValueFromAttribute = (attrId: string, value: string) => {
    const attr = attributes.find((a: any) => a.id === attrId || a.id.toString() === attrId);
    if (!attr) return;
    const newValues = attr.values.filter((v: string) => v !== value);
    updateAttributeMutation.mutate({ id: attrId, values: newValues });
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">إدارة المنتجات</h1>
          <p className="text-slate-500 mt-1 text-sm">أضف، عدل، وأدر منتجات متجرك.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/products/new">
            <Plus className="w-5 h-5" />
            إضافة منتج
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="products" className="w-full" dir="rtl">
        <TabsList className="mb-6 h-auto p-1 bg-white shadow-sm border border-slate-100 rounded-2xl w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="products" className="px-6 py-2.5 rounded-xl font-bold">المنتجات</TabsTrigger>
          <TabsTrigger value="categories" className="px-6 py-2.5 rounded-xl font-bold">التصنيفات</TabsTrigger>
          <TabsTrigger value="attributes" className="px-6 py-2.5 rounded-xl font-bold">المتغيرات</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-0">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <DataTable 
              data={products}
              pageCount={pageCount}
              pagination={pagination}
              setPagination={setPagination}
              isLoading={isProductsLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categories={categories}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
            />
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          {isCategoriesLoading ? (
             <div className="bg-white rounded-3xl p-12 flex justify-center border border-slate-100 shadow-sm"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <CategoriesManager
              // map backend ID to frontend id if parent_id is used
              categories={categories.map((c: any) => ({ 
                ...c, 
                id: c.id.toString(), 
                parentId: c.parent_id?.toString() || null, 
                addonGroupIds: c.addon_groups ? c.addon_groups.map((g: any) => typeof g.id === 'string' ? parseInt(g.id, 10) : g.id) : c.addon_group_ids || []
              }))}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
              onBulkDeleteCategories={handleBulkDeleteCategories}
              isSubmitting={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              isBulkDeleting={bulkDeleteCategoryMutation.isPending}
            />
          )}
        </TabsContent>

        <TabsContent value="attributes" className="mt-0">
           {isAttributesLoading ? (
             <div className="bg-white rounded-3xl p-12 flex justify-center border border-slate-100 shadow-sm"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <AttributesManager
              attributes={attributes.map((a: any) => ({ ...a, id: a.id.toString() }))}
              onAddAttribute={handleAddAttribute}
              onDeleteAttribute={handleDeleteAttribute}
              onAddValueToAttribute={handleAddValueToAttribute}
              onRemoveValueFromAttribute={handleRemoveValueFromAttribute}
              isAdding={createAttributeMutation.isPending}
              isUpdating={updateAttributeMutation.isPending}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
