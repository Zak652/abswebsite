import { apiClient } from "./client";
import type { ProductCategory, Product, ProductConfigSection } from "@/types/products";

export const productsService = {
  getCategories: () =>
    apiClient.get<ProductCategory[]>("/products/categories/"),

  getByCategory: (categorySlug: string) =>
    apiClient.get<Product[]>("/products/", {
      params: { category: categorySlug },
    }),

  getAll: () =>
    apiClient.get<Product[]>("/products/"),

  getProduct: (slug: string) =>
    apiClient.get<Product>(`/products/${slug}/`),

  getConfig: (slug: string) =>
    apiClient.get<ProductConfigSection[]>(`/products/${slug}/config/`),
};
