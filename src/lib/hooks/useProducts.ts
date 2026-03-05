"use client";

import { useQuery } from "@tanstack/react-query";
import { productsService } from "@/lib/api/products";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useProductCategories() {
  return useQuery({
    queryKey: ["products", "categories"],
    queryFn: () => productsService.getCategories().then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useProductsByCategory(categorySlug: string) {
  return useQuery({
    queryKey: ["products", "category", categorySlug],
    queryFn: () => productsService.getByCategory(categorySlug).then((r) => r.data),
    staleTime: STALE_TIME,
    enabled: !!categorySlug,
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productsService.getAll().then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["products", "detail", slug],
    queryFn: () => productsService.getProduct(slug).then((r) => r.data),
    staleTime: STALE_TIME,
    enabled: !!slug,
  });
}

export function useProductConfig(slug: string) {
  return useQuery({
    queryKey: ["products", "config", slug],
    queryFn: () => productsService.getConfig(slug).then((r) => r.data),
    staleTime: STALE_TIME,
    enabled: !!slug,
  });
}
