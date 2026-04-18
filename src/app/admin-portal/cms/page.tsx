"use client";

import Link from "next/link";
import {
    Globe,
    Navigation,
    Briefcase,
    Cpu,
    Shield,
    BookOpen,
    Settings,
    Search,
    ImageIcon,
    GalleryHorizontalEnd,
} from "lucide-react";
import {
    useAdminHeroes,
    useAdminBlocks,
    useAdminNavigation,
    useAdminServices,
    useAdminModules,
    useAdminPricingPlans,
    useAdminSupportTiers,
    useAdminCaseStudies,
    useAdminSettings,
    useAdminPageMetas,
    useAdminMedia,
} from "@/lib/hooks/useCMSAdmin";

const sections = [
    {
        href: "/admin-portal/cms/content",
        label: "Pages & Content",
        description: "Hero sections and page blocks",
        icon: Globe,
        useCount: () => {
            const heroes = useAdminHeroes();
            const blocks = useAdminBlocks();
            return {
                count: (heroes.data?.length ?? 0) + (blocks.data?.length ?? 0),
                isLoading: heroes.isLoading || blocks.isLoading,
            };
        },
    },
    {
        href: "/admin-portal/cms/navigation",
        label: "Navigation",
        description: "Header and footer links",
        icon: Navigation,
        useCount: () => {
            const { data, isLoading } = useAdminNavigation();
            return { count: data?.length ?? 0, isLoading };
        },
    },
    {
        href: "/admin-portal/cms/services",
        label: "Services",
        description: "Service offerings with publishing workflow",
        icon: Briefcase,
        useCount: () => {
            const { data, isLoading } = useAdminServices();
            return { count: data?.length ?? 0, isLoading };
        },
    },
    {
        href: "/admin-portal/cms/arcplus",
        label: "Arcplus",
        description: "Modules and pricing plans",
        icon: Cpu,
        useCount: () => {
            const modules = useAdminModules();
            const plans = useAdminPricingPlans();
            return {
                count: (modules.data?.length ?? 0) + (plans.data?.length ?? 0),
                isLoading: modules.isLoading || plans.isLoading,
            };
        },
    },
    {
        href: "/admin-portal/cms/support",
        label: "Support Tiers",
        description: "Support comparison table",
        icon: Shield,
        useCount: () => {
            const { data, isLoading } = useAdminSupportTiers();
            return { count: data?.length ?? 0, isLoading };
        },
    },
    {
        href: "/admin-portal/cms/case-studies",
        label: "Case Studies",
        description: "Customer success stories",
        icon: BookOpen,
        useCount: () => {
            const { data, isLoading } = useAdminCaseStudies();
            return { count: data?.length ?? 0, isLoading };
        },
    },
    {
        href: "/admin-portal/cms/settings",
        label: "Site Settings",
        description: "Company info, currency rates, social links",
        icon: Settings,
        useCount: () => {
            const { data, isLoading } = useAdminSettings();
            return { count: data ? 1 : 0, isLoading };
        },
    },
    {
        href: "/admin-portal/cms/seo",
        label: "SEO / Page Meta",
        description: "Title, description, OG images per route",
        icon: Search,
        useCount: () => {
            const { data, isLoading } = useAdminPageMetas();
            return { count: data?.length ?? 0, isLoading };
        },
    },
    {
        href: "/admin-portal/cms/media",
        label: "Media Library",
        description: "Images, documents, and media assets",
        icon: ImageIcon,
        useCount: () => {
            const { data, isLoading } = useAdminMedia();
            return { count: data?.length ?? 0, isLoading };
        },
    },
    {
        href: "/admin-portal/cms/galleries",
        label: "Product Galleries",
        description: "5-layer image sequences per product",
        icon: GalleryHorizontalEnd,
        useCount: () => ({ count: 0, isLoading: false }),
    },
];

function SectionCard({
    section,
}: {
    section: (typeof sections)[0];
}) {
    const { count, isLoading } = section.useCount();
    const Icon = section.icon;

    return (
        <Link
            href={section.href}
            className="group bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-300 hover:shadow-sm transition-all"
        >
            <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-neutral-50 group-hover:bg-primary-50 transition-colors">
                    <Icon className="w-5 h-5 text-neutral-600 group-hover:text-primary-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-primary-900 group-hover:text-primary-700">
                        {section.label}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        {section.description}
                    </p>
                    <p className="text-xs text-neutral-400 mt-2">
                        {isLoading ? "Loading…" : `${count} item${count !== 1 ? "s" : ""}`}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export default function CMSOverviewPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-primary-900 font-heading">
                    Content Management
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                    Manage all website content, navigation, and settings
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.map((section) => (
                    <SectionCard key={section.href} section={section} />
                ))}
            </div>
        </div>
    );
}
