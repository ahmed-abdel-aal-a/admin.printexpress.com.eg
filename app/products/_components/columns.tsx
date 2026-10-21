"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Product } from "../types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { productsApi } from "@/lib/services/products";

// A small helper hook/component could be passed for the delete action if needed,
// but for simplicity, we can just define the columns and handle actions in the component.

export const getColumns = (onDelete: (id: string) => void): ColumnDef<any, any>[] => [
  {
    id: "select",
    header: ({ table }: any) => (
      <div className="flex items-center justify-center px-2">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }: any) => (
      <div className="flex items-center justify-center px-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "المنتج",
    cell: ({ row }: any) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">📦</span>
            )}
          </div>
          <div>
            <div className="font-bold text-slate-800">{product.name}</div>
            <div className="text-xs text-slate-500">{product.category?.name || "بدون تصنيف"}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: "السعر",
    cell: ({ row }: any) => {
      const product = row.original;
      return (
        <div className="font-medium text-slate-700">
          {product.discount_price ? (
            <div className="flex flex-col">
              <span className="text-indigo-600 font-bold">{product.discount_price} ج.م</span>
              <span className="text-xs text-slate-400 line-through">{product.price} ج.م</span>
            </div>
          ) : (
            <span>{product.price} ج.م</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "المخزون",
    cell: ({ row }: any) => {
      const product = row.original;
      if (!product.track_inventory) return <span className="text-slate-500 text-sm">غير متتبع</span>;
      
      const qty = product.quantity ?? 0;
      let colorClass = "text-emerald-600 bg-emerald-50";
      let text = `متوفر (${qty})`;
      if (qty === 0) {
        colorClass = "text-rose-600 bg-rose-50";
        text = "نفذت الكمية";
      } else if (qty <= 5) {
        colorClass = "text-amber-600 bg-amber-50";
        text = `منخفض (${qty})`;
      }

      return (
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${colorClass}`}>
          {text}
        </span>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "الحالة",
    cell: ({ row }: any) => {
      const isActive = row.getValue("is_active");
      return (
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
          {isActive ? 'نشط' : 'مسودة'}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: any) => {
      const product = row.original;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-600">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
            onClick={() => onDelete(product.id.toString())}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
