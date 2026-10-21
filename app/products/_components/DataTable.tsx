"use client";

import { useState, useMemo } from "react";
import {
  flexRender,
  createCoreRowModel,
  createPaginatedRowModel,
  useTable,
  stockFeatures,
  RowSelectionState,
} from "@tanstack/react-table";
import { getColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { productsApi } from "@/lib/services/products";
import toast from "react-hot-toast";

interface DataTableProps {
  data: any[];
  pageCount: number;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: (updater: any) => void;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categories: any[];
  categoryId: string;
  setCategoryId: (id: string) => void;
}

export function DataTable({
  data,
  pageCount,
  pagination,
  setPagination,
  isLoading,
  searchQuery,
  setSearchQuery,
  categories,
  categoryId,
  setCategoryId,
}: DataTableProps) {
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [inputValue, setInputValue] = useState(searchQuery);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSearchQuery(e.target.value);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم الحذف بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => productsApi.bulkDeleteProducts(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setRowSelection({});
      toast.success("تم حذف المنتجات بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف الجماعي"),
  });

  const columns = useMemo(() => getColumns((id) => {
    if (confirm("هل أنت متأكد من الحذف؟")) {
      deleteMutation.mutate(id);
    }
  }), []);

  const table = (useTable as any)({
    features: stockFeatures,
    data,
    columns,
    pageCount,
    state: {
      pagination,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: createCoreRowModel(),
    getPaginatedRowModel: createPaginatedRowModel(),
    manualPagination: true,
    getRowId: (row: any) => row.id.toString(),
  });

  const selectedRowsIds = Object.keys(rowSelection);

  const handleBulkDelete = () => {
    if (selectedRowsIds.length === 0) return;
    if (confirm(`هل أنت متأكد من حذف ${selectedRowsIds.length} منتج؟`)) {
      bulkDeleteMutation.mutate(selectedRowsIds);
    }
  };

  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = pagination.pageIndex < pageCount - 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="ابحث عن منتج..."
            value={inputValue}
            onChange={handleInputChange}
            className="w-64 pl-10 h-11"
          />
          <select 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-11 w-48 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            dir="rtl"
          >
            <option value="all">كل التصنيفات</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
            ))}
          </select>
        </div>
        {selectedRowsIds.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="gap-2 rounded-xl"
          >
            {bulkDeleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            حذف المحدد ({selectedRowsIds.length})
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
              {table.getHeaderGroups().map((headerGroup: any) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => (
                    <th key={header.id} className="h-12 px-4 font-bold align-middle">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="h-64 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: any) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`border-b border-slate-50 transition-colors hover:bg-slate-50/50 ${row.getIsSelected() ? 'bg-indigo-50/30' : ''}`}
                  >
                    {row.getVisibleCells().map((cell: any) => (
                      <td key={cell.id} className="p-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-48 text-center text-slate-500">
                    لا توجد منتجات مطابقة لبحثك.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-slate-500">
          تم تحديد {selectedRowsIds.length} من {data.length} منتج.
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination((p: any) => ({ ...p, pageIndex: p.pageIndex - 1 }))}
            disabled={!canPreviousPage}
            className="rounded-xl"
          >
            السابق
          </Button>
          <span className="text-sm font-medium text-slate-600">
            صفحة {pagination.pageIndex + 1} من {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination((p: any) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            disabled={!canNextPage}
            className="rounded-xl"
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}
