export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

export interface ProductConfigOption {
  id: string;
  option_id: string;
  name: string;
  description: string;
  price_usd: string;
  badge: string;
  is_default: boolean;
  overlay_icon: string;
  overlay_label: string;
  overlay_position: string;
  overlay_color: string;
  order: number;
}

export interface ProductConfigSection {
  id: string;
  name: string;
  step_number: number;
  order: number;
  options: ProductConfigOption[];
}

export interface Product {
  id: string;
  category: ProductCategory;
  name: string;
  slug: string;
  short_description: string;
  full_description: string;
  image_hero: string;
  image_context: string;
  image_detail: string;
  image_usecase: string;
  datasheet_url: string;
  specifications: Record<string, string>;
  is_configurable: boolean;
  is_recommended: boolean;
  is_active: boolean;
  order: number;
}

export interface ProductDetail extends Product {
  config_sections: ProductConfigSection[];
}
