export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  addonGroupIds?: number[];
};

export type Attribute = {
  id: string;
  name: string;
  values: string[];
};

export type VariantAttribute = {
  name: string;
  value: string;
};

export type Variant = {
  id: string;
  name?: string;
  attributes?: VariantAttribute[];
  price?: string;
  discountPrice?: string;
  sku?: string;
  trackInventory?: boolean;
  quantity?: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  categoryId: string | null;
  type?: "simple" | "variable";
  price?: string;
  discountPrice?: string;
  sku?: string;
  trackInventory?: boolean;
  quantity?: string;
  variants?: Variant[];
  images?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};
