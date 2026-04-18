/**
 * Client-side CMS admin API service.
 *
 * Follows existing `adminService` pattern in src/lib/api/admin.ts.
 * Used exclusively by admin portal CMS pages (TanStack Query hooks).
 */

import { apiClient } from "./client";
import type {
    SiteSettingsData,
    PageMetaData,
    AdminHeroSectionData,
    AdminPageBlockData,
    NavigationItemData,
    MediaAssetData,
    AssetTagData,
    AdminServiceOfferingData,
    AdminArcplusModuleData,
    AdminPricingPlanData,
    PlanFeatureData,
    AdminSupportTierData,
    SupportFeatureData,
    AdminCaseStudyData,
    ContentRevisionData,
    TransitionResponse,
    TransitionRequest,
    ProductImageData,
    BlogCategoryData,
    AdminBlogPostData,
    AdminEmailTemplateData,
    AdminTestimonialData,
    RegionalVariantData,
} from "@/types/cms";

const CMS = "/admin/cms";

export const cmsAdminService = {
    // ── Site Settings ──────────────────────────────────────────────
    getSettings: () => apiClient.get<SiteSettingsData>(`${CMS}/settings/`),

    updateSettings: (data: Partial<SiteSettingsData>) =>
        apiClient.patch<SiteSettingsData>(`${CMS}/settings/`, data),

    // ── Page Meta ──────────────────────────────────────────────────
    getPageMetas: () => apiClient.get<PageMetaData[]>(`${CMS}/meta/`),

    createPageMeta: (data: Partial<PageMetaData>) =>
        apiClient.post<PageMetaData>(`${CMS}/meta/`, data),

    updatePageMeta: (id: number, data: Partial<PageMetaData>) =>
        apiClient.patch<PageMetaData>(`${CMS}/meta/${id}/`, data),

    deletePageMeta: (id: number) => apiClient.delete(`${CMS}/meta/${id}/`),

    // ── Hero Sections ──────────────────────────────────────────────
    getHeroes: () => apiClient.get<AdminHeroSectionData[]>(`${CMS}/hero/`),

    createHero: (data: Record<string, unknown>) =>
        apiClient.post<AdminHeroSectionData>(`${CMS}/hero/`, data),

    updateHero: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<AdminHeroSectionData>(`${CMS}/hero/${id}/`, data),

    deleteHero: (id: number) => apiClient.delete(`${CMS}/hero/${id}/`),

    transitionHero: (id: number, data: TransitionRequest) =>
        apiClient.post<TransitionResponse>(`${CMS}/hero/${id}/transition/`, data),

    // ── Page Blocks ────────────────────────────────────────────────
    getBlocks: () => apiClient.get<AdminPageBlockData[]>(`${CMS}/blocks/`),

    createBlock: (data: Record<string, unknown>) =>
        apiClient.post<AdminPageBlockData>(`${CMS}/blocks/`, data),

    updateBlock: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<AdminPageBlockData>(`${CMS}/blocks/${id}/`, data),

    deleteBlock: (id: number) => apiClient.delete(`${CMS}/blocks/${id}/`),

    transitionBlock: (id: number, data: TransitionRequest) =>
        apiClient.post<TransitionResponse>(
            `${CMS}/blocks/${id}/transition/`,
            data
        ),

    // ── Navigation ─────────────────────────────────────────────────
    getNavigation: () =>
        apiClient.get<NavigationItemData[]>(`${CMS}/navigation/`),

    createNavItem: (data: Record<string, unknown>) =>
        apiClient.post<NavigationItemData>(`${CMS}/navigation/`, data),

    updateNavItem: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<NavigationItemData>(`${CMS}/navigation/${id}/`, data),

    deleteNavItem: (id: number) =>
        apiClient.delete(`${CMS}/navigation/${id}/`),

    reorderNavigation: (items: { id: number; order: number }[]) =>
        apiClient.post(`${CMS}/navigation/reorder/`, items),

    // ── Media ──────────────────────────────────────────────────────
    getMedia: () => apiClient.get<MediaAssetData[]>(`${CMS}/media/`),

    uploadMedia: (formData: FormData) =>
        apiClient.post<MediaAssetData>(`${CMS}/media/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    updateMedia: (id: string, data: Partial<MediaAssetData>) =>
        apiClient.patch<MediaAssetData>(`${CMS}/media/${id}/`, data),

    deleteMedia: (id: string) => apiClient.delete(`${CMS}/media/${id}/`),

    getMediaTags: () => apiClient.get<AssetTagData[]>(`${CMS}/media/tags/`),

    createMediaTag: (data: { name: string; slug: string }) =>
        apiClient.post<AssetTagData>(`${CMS}/media/tags/`, data),

    // ── Services ───────────────────────────────────────────────────
    getServices: () =>
        apiClient.get<AdminServiceOfferingData[]>(`${CMS}/services/`),

    createService: (data: Record<string, unknown>) =>
        apiClient.post<AdminServiceOfferingData>(`${CMS}/services/`, data),

    updateService: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<AdminServiceOfferingData>(`${CMS}/services/${id}/`, data),

    deleteService: (id: number) => apiClient.delete(`${CMS}/services/${id}/`),

    transitionService: (id: number, data: TransitionRequest) =>
        apiClient.post<TransitionResponse>(
            `${CMS}/services/${id}/transition/`,
            data
        ),

    // ── Arcplus Modules ────────────────────────────────────────────
    getModules: () =>
        apiClient.get<AdminArcplusModuleData[]>(`${CMS}/modules/`),

    createModule: (data: Record<string, unknown>) =>
        apiClient.post<AdminArcplusModuleData>(`${CMS}/modules/`, data),

    updateModule: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<AdminArcplusModuleData>(`${CMS}/modules/${id}/`, data),

    deleteModule: (id: number) => apiClient.delete(`${CMS}/modules/${id}/`),

    transitionModule: (id: number, data: TransitionRequest) =>
        apiClient.post<TransitionResponse>(
            `${CMS}/modules/${id}/transition/`,
            data
        ),

    // ── Pricing Plans ──────────────────────────────────────────────
    getPricingPlans: () =>
        apiClient.get<AdminPricingPlanData[]>(`${CMS}/pricing/`),

    createPricingPlan: (data: Record<string, unknown>) =>
        apiClient.post<AdminPricingPlanData>(`${CMS}/pricing/`, data),

    updatePricingPlan: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<AdminPricingPlanData>(`${CMS}/pricing/${id}/`, data),

    deletePricingPlan: (id: number) =>
        apiClient.delete(`${CMS}/pricing/${id}/`),

    transitionPricingPlan: (id: number, data: TransitionRequest) =>
        apiClient.post<TransitionResponse>(
            `${CMS}/pricing/${id}/transition/`,
            data
        ),

    getPlanFeatures: () =>
        apiClient.get<PlanFeatureData[]>(`${CMS}/plan-features/`),

    // ── Support Tiers ──────────────────────────────────────────────
    getSupportTiers: () =>
        apiClient.get<AdminSupportTierData[]>(`${CMS}/support-tiers/`),

    createSupportTier: (data: Record<string, unknown>) =>
        apiClient.post<AdminSupportTierData>(`${CMS}/support-tiers/`, data),

    updateSupportTier: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<AdminSupportTierData>(
            `${CMS}/support-tiers/${id}/`,
            data
        ),

    deleteSupportTier: (id: number) =>
        apiClient.delete(`${CMS}/support-tiers/${id}/`),

    transitionSupportTier: (id: number, data: TransitionRequest) =>
        apiClient.post<TransitionResponse>(
            `${CMS}/support-tiers/${id}/transition/`,
            data
        ),

    getSupportFeatures: () =>
        apiClient.get<SupportFeatureData[]>(`${CMS}/support-features/`),

    // ── Case Studies ───────────────────────────────────────────────
    getCaseStudies: () =>
        apiClient.get<AdminCaseStudyData[]>(`${CMS}/case-studies/`),

    createCaseStudy: (data: Record<string, unknown>) =>
        apiClient.post<AdminCaseStudyData>(`${CMS}/case-studies/`, data),

    updateCaseStudy: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<AdminCaseStudyData>(`${CMS}/case-studies/${id}/`, data),

    deleteCaseStudy: (id: number) =>
        apiClient.delete(`${CMS}/case-studies/${id}/`),

    transitionCaseStudy: (id: number, data: TransitionRequest) =>
        apiClient.post<TransitionResponse>(
            `${CMS}/case-studies/${id}/transition/`,
            data
        ),

    // ── Revisions ──────────────────────────────────────────────────
    getRevisions: (contentType: number, objectId: string) =>
        apiClient.get<ContentRevisionData[]>(`${CMS}/revisions/`, {
            params: { content_type: contentType, object_id: objectId },
        }),

    rollback: (revisionId: string) =>
        apiClient.post(`${CMS}/revisions/${revisionId}/rollback/`),

    // ── Product Gallery ────────────────────────────────────────────
    getProductGallery: (productId: string) =>
        apiClient.get<ProductImageData[]>(`${CMS}/products/${productId}/gallery/`),

    createProductImage: (productId: string, data: Record<string, unknown>) =>
        apiClient.post<ProductImageData>(`${CMS}/products/${productId}/gallery/`, data),

    updateProductImage: (productId: string, imageId: number, data: Record<string, unknown>) =>
        apiClient.patch<ProductImageData>(`${CMS}/products/${productId}/gallery/${imageId}/`, data),

    deleteProductImage: (productId: string, imageId: number) =>
        apiClient.delete(`${CMS}/products/${productId}/gallery/${imageId}/`),

    reorderProductImages: (productId: string, items: { id: number; order: number }[]) =>
        apiClient.post(`${CMS}/products/${productId}/gallery/reorder/`, { items }),

    // ── Blog Categories ────────────────────────────────────────────
    getBlogCategories: () =>
        apiClient.get<BlogCategoryData[]>(`${CMS}/blog-categories/`),

    createBlogCategory: (data: Record<string, unknown>) =>
        apiClient.post<BlogCategoryData>(`${CMS}/blog-categories/`, data),

    updateBlogCategory: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<BlogCategoryData>(`${CMS}/blog-categories/${id}/`, data),

    deleteBlogCategory: (id: number) =>
        apiClient.delete(`${CMS}/blog-categories/${id}/`),

    // ── Blog Posts ─────────────────────────────────────────────────
    getBlogPosts: () =>
        apiClient.get<AdminBlogPostData[]>(`${CMS}/blog-posts/`),

    createBlogPost: (data: Record<string, unknown>) =>
        apiClient.post<AdminBlogPostData>(`${CMS}/blog-posts/`, data),

    updateBlogPost: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<AdminBlogPostData>(`${CMS}/blog-posts/${id}/`, data),

    deleteBlogPost: (id: number) =>
        apiClient.delete(`${CMS}/blog-posts/${id}/`),

    transitionBlogPost: (id: number, data: TransitionRequest) =>
        apiClient.post<TransitionResponse>(
            `${CMS}/blog-posts/${id}/transition/`,
            data
        ),

    // ── Email Templates ────────────────────────────────────────────
    getEmailTemplates: () =>
        apiClient.get<AdminEmailTemplateData[]>(`${CMS}/email-templates/`),

    createEmailTemplate: (data: Record<string, unknown>) =>
        apiClient.post<AdminEmailTemplateData>(`${CMS}/email-templates/`, data),

    updateEmailTemplate: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<AdminEmailTemplateData>(`${CMS}/email-templates/${id}/`, data),

    deleteEmailTemplate: (id: number) =>
        apiClient.delete(`${CMS}/email-templates/${id}/`),

    transitionEmailTemplate: (id: number, data: TransitionRequest) =>
        apiClient.post<TransitionResponse>(
            `${CMS}/email-templates/${id}/transition/`,
            data
        ),

    // ── Testimonials ───────────────────────────────────────────────
    getTestimonials: () =>
        apiClient.get<AdminTestimonialData[]>(`${CMS}/testimonials/`),

    createTestimonial: (data: Record<string, unknown>) =>
        apiClient.post<AdminTestimonialData>(`${CMS}/testimonials/`, data),

    updateTestimonial: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<AdminTestimonialData>(`${CMS}/testimonials/${id}/`, data),

    deleteTestimonial: (id: number) =>
        apiClient.delete(`${CMS}/testimonials/${id}/`),

    transitionTestimonial: (id: number, data: TransitionRequest) =>
        apiClient.post<TransitionResponse>(
            `${CMS}/testimonials/${id}/transition/`,
            data
        ),

    // ── Regional Variants ──────────────────────────────────────────
    getRegionalVariants: (contentType?: number, objectId?: string) =>
        apiClient.get<RegionalVariantData[]>(`${CMS}/regional-variants/`, {
            params: { content_type: contentType, object_id: objectId },
        }),

    createRegionalVariant: (data: Record<string, unknown>) =>
        apiClient.post<RegionalVariantData>(`${CMS}/regional-variants/`, data),

    updateRegionalVariant: (id: number, data: Record<string, unknown>) =>
        apiClient.patch<RegionalVariantData>(`${CMS}/regional-variants/${id}/`, data),

    deleteRegionalVariant: (id: number) =>
        apiClient.delete(`${CMS}/regional-variants/${id}/`),
};
