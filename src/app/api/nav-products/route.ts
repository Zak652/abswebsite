import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface BackendProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  image_hero: string;
  category: { slug: string };
}

interface NavMenuItem {
  name: string;
  desc: string;
  image: string;
  href: string;
}

export async function GET() {
  try {
    const [scannersRes, tagsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/products/?category=scanners`, {
        next: { revalidate: 300 },
      }),
      fetch(`${API_BASE_URL}/products/?category=tags`, {
        next: { revalidate: 300 },
      }),
    ]);

    const scanners: BackendProduct[] = scannersRes.ok
      ? ((await scannersRes.json()).results ?? (await []))
      : [];
    const tags: BackendProduct[] = tagsRes.ok
      ? ((await tagsRes.json()).results ?? (await []))
      : [];

    const toMenuItem = (p: BackendProduct): NavMenuItem => ({
      name: p.name,
      desc: p.short_description,
      image: p.image_hero || "/images/barcode_scanner_1772490256748.png",
      href: `/${p.category.slug === "scanners" ? "scanners" : "tags"}/${p.slug}`,
    });

    return NextResponse.json({
      scanners: scanners.map(toMenuItem),
      tags: tags.map(toMenuItem),
    });
  } catch {
    return NextResponse.json({ scanners: [], tags: [] });
  }
}
