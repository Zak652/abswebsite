/**
 * TanStack Query hooks for CMS admin portal.
 *
 * Follows existing hook pattern in src/lib/hooks/useAdmin.ts.
 * Used exclusively in admin-portal CMS pages.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cmsAdminService } from "@/lib/api/cms";
import type { TransitionRequest } from "@/types/cms";

/* ------------------------------------------------------------------ */
/*  Query keys                                                        */
/* ------------------------------------------------------------------ */

const keys = {
    settings: ["cms", "settings"] as const,
    pageMetas: ["cms", "page-metas"] as const,
    heroes: ["cms", "heroes"] as const,
    blocks: ["cms", "blocks"] as const,
    navigation: ["cms", "navigation"] as const,
    media: ["cms", "media"] as const,
    mediaTags: ["cms", "media-tags"] as const,
    services: ["cms", "services"] as const,
    modules: ["cms", "modules"] as const,
    pricingPlans: ["cms", "pricing-plans"] as const,
    planFeatures: ["cms", "plan-features"] as const,
    supportTiers: ["cms", "support-tiers"] as const,
    supportFeatures: ["cms", "support-features"] as const,
    caseStudies: ["cms", "case-studies"] as const,
    revisions: (ct: number, oid: string) =>
        ["cms", "revisions", ct, oid] as const,
    productGallery: (productId: string) =>
        ["cms", "product-gallery", productId] as const,
    blogCategories: ["cms", "blog-categories"] as const,
    blogPosts: ["cms", "blog-posts"] as const,
    emailTemplates: ["cms", "email-templates"] as const,
    testimonials: ["cms", "testimonials"] as const,
    regionalVariants: ["cms", "regional-variants"] as const,
};

/* ------------------------------------------------------------------ */
/*  Site Settings                                                     */
/* ------------------------------------------------------------------ */

export function useAdminSettings() {
    return useQuery({
        queryKey: keys.settings,
        queryFn: () => cmsAdminService.getSettings().then((r) => r.data),
    });
}

export function useUpdateSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof cmsAdminService.updateSettings>[0]) =>
            cmsAdminService.updateSettings(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.settings }),
    });
}

/* ------------------------------------------------------------------ */
/*  Page Meta                                                         */
/* ------------------------------------------------------------------ */

export function useAdminPageMetas() {
    return useQuery({
        queryKey: keys.pageMetas,
        queryFn: () => cmsAdminService.getPageMetas().then((r) => r.data),
    });
}

export function useCreatePageMeta() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof cmsAdminService.createPageMeta>[0]) =>
            cmsAdminService.createPageMeta(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.pageMetas }),
    });
}

export function useUpdatePageMeta() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: Parameters<typeof cmsAdminService.updatePageMeta>[1];
        }) => cmsAdminService.updatePageMeta(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.pageMetas }),
    });
}

export function useDeletePageMeta() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deletePageMeta(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.pageMetas }),
    });
}

/* ------------------------------------------------------------------ */
/*  Hero Sections                                                     */
/* ------------------------------------------------------------------ */

export function useAdminHeroes() {
    return useQuery({
        queryKey: keys.heroes,
        queryFn: () => cmsAdminService.getHeroes().then((r) => r.data),
    });
}

export function useCreateHero() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createHero(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.heroes }),
    });
}

export function useUpdateHero() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateHero(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.heroes }),
    });
}

export function useDeleteHero() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteHero(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.heroes }),
    });
}

export function useTransitionHero() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
            cmsAdminService.transitionHero(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.heroes }),
    });
}

/* ------------------------------------------------------------------ */
/*  Page Blocks                                                       */
/* ------------------------------------------------------------------ */

export function useAdminBlocks() {
    return useQuery({
        queryKey: keys.blocks,
        queryFn: () => cmsAdminService.getBlocks().then((r) => r.data),
    });
}

export function useCreateBlock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createBlock(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blocks }),
    });
}

export function useUpdateBlock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateBlock(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blocks }),
    });
}

export function useDeleteBlock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteBlock(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blocks }),
    });
}

export function useTransitionBlock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
            cmsAdminService.transitionBlock(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blocks }),
    });
}

/* ------------------------------------------------------------------ */
/*  Navigation                                                        */
/* ------------------------------------------------------------------ */

export function useAdminNavigation() {
    return useQuery({
        queryKey: keys.navigation,
        queryFn: () => cmsAdminService.getNavigation().then((r) => r.data),
    });
}

export function useCreateNavItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createNavItem(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.navigation }),
    });
}

export function useUpdateNavItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateNavItem(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.navigation }),
    });
}

export function useDeleteNavItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteNavItem(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.navigation }),
    });
}

export function useReorderNavigation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (items: { id: number; order: number }[]) =>
            cmsAdminService.reorderNavigation(items),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.navigation }),
    });
}

/* ------------------------------------------------------------------ */
/*  Media                                                             */
/* ------------------------------------------------------------------ */

export function useAdminMedia() {
    return useQuery({
        queryKey: keys.media,
        queryFn: () => cmsAdminService.getMedia().then((r) => r.data),
    });
}

export function useUploadMedia() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) =>
            cmsAdminService.uploadMedia(formData).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.media }),
    });
}

export function useUpdateMedia() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Parameters<typeof cmsAdminService.updateMedia>[1];
        }) => cmsAdminService.updateMedia(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.media }),
    });
}

export function useDeleteMedia() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => cmsAdminService.deleteMedia(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.media }),
    });
}

export function useAdminMediaTags() {
    return useQuery({
        queryKey: keys.mediaTags,
        queryFn: () => cmsAdminService.getMediaTags().then((r) => r.data),
    });
}

export function useCreateMediaTag() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; slug: string }) =>
            cmsAdminService.createMediaTag(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.mediaTags }),
    });
}

/* ------------------------------------------------------------------ */
/*  Services                                                          */
/* ------------------------------------------------------------------ */

export function useAdminServices() {
    return useQuery({
        queryKey: keys.services,
        queryFn: () => cmsAdminService.getServices().then((r) => r.data),
    });
}

export function useCreateService() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createService(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.services }),
    });
}

export function useUpdateService() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateService(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.services }),
    });
}

export function useDeleteService() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteService(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.services }),
    });
}

export function useTransitionService() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
            cmsAdminService.transitionService(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.services }),
    });
}

/* ------------------------------------------------------------------ */
/*  Arcplus Modules                                                   */
/* ------------------------------------------------------------------ */

export function useAdminModules() {
    return useQuery({
        queryKey: keys.modules,
        queryFn: () => cmsAdminService.getModules().then((r) => r.data),
    });
}

export function useCreateModule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createModule(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.modules }),
    });
}

export function useUpdateModule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateModule(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.modules }),
    });
}

export function useDeleteModule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteModule(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.modules }),
    });
}

export function useTransitionModule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
            cmsAdminService.transitionModule(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.modules }),
    });
}

/* ------------------------------------------------------------------ */
/*  Pricing Plans                                                     */
/* ------------------------------------------------------------------ */

export function useAdminPricingPlans() {
    return useQuery({
        queryKey: keys.pricingPlans,
        queryFn: () => cmsAdminService.getPricingPlans().then((r) => r.data),
    });
}

export function useCreatePricingPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createPricingPlan(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.pricingPlans }),
    });
}

export function useUpdatePricingPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updatePricingPlan(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.pricingPlans }),
    });
}

export function useDeletePricingPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deletePricingPlan(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.pricingPlans }),
    });
}

export function useTransitionPricingPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
            cmsAdminService.transitionPricingPlan(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.pricingPlans }),
    });
}

export function useAdminPlanFeatures() {
    return useQuery({
        queryKey: keys.planFeatures,
        queryFn: () => cmsAdminService.getPlanFeatures().then((r) => r.data),
    });
}

/* ------------------------------------------------------------------ */
/*  Support Tiers                                                     */
/* ------------------------------------------------------------------ */

export function useAdminSupportTiers() {
    return useQuery({
        queryKey: keys.supportTiers,
        queryFn: () => cmsAdminService.getSupportTiers().then((r) => r.data),
    });
}

export function useCreateSupportTier() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createSupportTier(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.supportTiers }),
    });
}

export function useUpdateSupportTier() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateSupportTier(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.supportTiers }),
    });
}

export function useDeleteSupportTier() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteSupportTier(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.supportTiers }),
    });
}

export function useTransitionSupportTier() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
            cmsAdminService.transitionSupportTier(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.supportTiers }),
    });
}

export function useAdminSupportFeatures() {
    return useQuery({
        queryKey: keys.supportFeatures,
        queryFn: () => cmsAdminService.getSupportFeatures().then((r) => r.data),
    });
}

/* ------------------------------------------------------------------ */
/*  Case Studies                                                      */
/* ------------------------------------------------------------------ */

export function useAdminCaseStudies() {
    return useQuery({
        queryKey: keys.caseStudies,
        queryFn: () => cmsAdminService.getCaseStudies().then((r) => r.data),
    });
}

export function useCreateCaseStudy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createCaseStudy(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.caseStudies }),
    });
}

export function useUpdateCaseStudy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateCaseStudy(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.caseStudies }),
    });
}

export function useDeleteCaseStudy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteCaseStudy(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.caseStudies }),
    });
}

export function useTransitionCaseStudy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
            cmsAdminService.transitionCaseStudy(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.caseStudies }),
    });
}

/* ------------------------------------------------------------------ */
/*  Revisions                                                         */
/* ------------------------------------------------------------------ */

export function useAdminRevisions(contentType: number, objectId: string) {
    return useQuery({
        queryKey: keys.revisions(contentType, objectId),
        queryFn: () =>
            cmsAdminService.getRevisions(contentType, objectId).then((r) => r.data),
        enabled: !!contentType && !!objectId,
    });
}

export function useRollback() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (revisionId: string) =>
            cmsAdminService.rollback(revisionId).then((r) => r.data),
        onSuccess: () => {
            // Invalidate all CMS queries since rollback can affect any model
            qc.invalidateQueries({ queryKey: ["cms"] });
        },
    });
}

/* ------------------------------------------------------------------ */
/*  Product Gallery                                                   */
/* ------------------------------------------------------------------ */

export function useProductGallery(productId: string) {
    return useQuery({
        queryKey: keys.productGallery(productId),
        queryFn: () =>
            cmsAdminService.getProductGallery(productId).then((r) => r.data),
        enabled: !!productId,
    });
}

export function useCreateProductImage(productId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createProductImage(productId, data).then((r) => r.data),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: keys.productGallery(productId) }),
    });
}

export function useUpdateProductImage(productId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ imageId, data }: { imageId: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateProductImage(productId, imageId, data).then((r) => r.data),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: keys.productGallery(productId) }),
    });
}

export function useDeleteProductImage(productId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (imageId: number) =>
            cmsAdminService.deleteProductImage(productId, imageId).then((r) => r.data),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: keys.productGallery(productId) }),
    });
}

export function useReorderProductImages(productId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (items: { id: number; order: number }[]) =>
            cmsAdminService.reorderProductImages(productId, items).then((r) => r.data),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: keys.productGallery(productId) }),
    });
}

/* ------------------------------------------------------------------ */
/*  Blog Categories                                                   */
/* ------------------------------------------------------------------ */

export function useAdminBlogCategories() {
    return useQuery({
        queryKey: keys.blogCategories,
        queryFn: () => cmsAdminService.getBlogCategories().then((r) => r.data),
    });
}

export function useCreateBlogCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createBlogCategory(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blogCategories }),
    });
}

export function useUpdateBlogCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateBlogCategory(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blogCategories }),
    });
}

export function useDeleteBlogCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteBlogCategory(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blogCategories }),
    });
}

/* ------------------------------------------------------------------ */
/*  Blog Posts                                                        */
/* ------------------------------------------------------------------ */

export function useAdminBlogPosts() {
    return useQuery({
        queryKey: keys.blogPosts,
        queryFn: () => cmsAdminService.getBlogPosts().then((r) => r.data),
    });
}

export function useCreateBlogPost() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createBlogPost(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blogPosts }),
    });
}

export function useUpdateBlogPost() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateBlogPost(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blogPosts }),
    });
}

export function useDeleteBlogPost() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteBlogPost(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blogPosts }),
    });
}

export function useTransitionBlogPost() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
            cmsAdminService.transitionBlogPost(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.blogPosts }),
    });
}

/* ------------------------------------------------------------------ */
/*  Email Templates                                                   */
/* ------------------------------------------------------------------ */

export function useAdminEmailTemplates() {
    return useQuery({
        queryKey: keys.emailTemplates,
        queryFn: () => cmsAdminService.getEmailTemplates().then((r) => r.data),
    });
}

export function useCreateEmailTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createEmailTemplate(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.emailTemplates }),
    });
}

export function useUpdateEmailTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateEmailTemplate(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.emailTemplates }),
    });
}

export function useDeleteEmailTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteEmailTemplate(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.emailTemplates }),
    });
}

export function useTransitionEmailTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
            cmsAdminService.transitionEmailTemplate(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.emailTemplates }),
    });
}

/* ------------------------------------------------------------------ */
/*  Testimonials                                                      */
/* ------------------------------------------------------------------ */

export function useAdminTestimonials() {
    return useQuery({
        queryKey: keys.testimonials,
        queryFn: () => cmsAdminService.getTestimonials().then((r) => r.data),
    });
}

export function useCreateTestimonial() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createTestimonial(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.testimonials }),
    });
}

export function useUpdateTestimonial() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateTestimonial(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.testimonials }),
    });
}

export function useDeleteTestimonial() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteTestimonial(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.testimonials }),
    });
}

export function useTransitionTestimonial() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
            cmsAdminService.transitionTestimonial(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.testimonials }),
    });
}

/* ------------------------------------------------------------------ */
/*  Regional Variants                                                 */
/* ------------------------------------------------------------------ */

export function useAdminRegionalVariants(contentType?: number, objectId?: string) {
    return useQuery({
        queryKey: [...keys.regionalVariants, contentType, objectId],
        queryFn: () =>
            cmsAdminService.getRegionalVariants(contentType, objectId).then((r) => r.data),
    });
}

export function useCreateRegionalVariant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            cmsAdminService.createRegionalVariant(data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.regionalVariants }),
    });
}

export function useUpdateRegionalVariant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            cmsAdminService.updateRegionalVariant(id, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.regionalVariants }),
    });
}

export function useDeleteRegionalVariant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cmsAdminService.deleteRegionalVariant(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.regionalVariants }),
    });
}
