from django.contrib import admin

from .models import Product, ProductCategory, ProductConfigOption, ProductConfigSection


class ProductConfigOptionInline(admin.TabularInline):
    model = ProductConfigOption
    extra = 1
    fields = [
        "option_id",
        "name",
        "description",
        "price_usd",
        "badge",
        "is_default",
        "order",
    ]


class ProductConfigSectionInline(admin.StackedInline):
    model = ProductConfigSection
    extra = 0
    fields = ["name", "step_number", "order"]
    show_change_link = True


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "order"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["order"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "category",
        "slug",
        "is_active",
        "is_configurable",
        "is_recommended",
        "order",
    ]
    list_filter = ["category", "is_active", "is_configurable"]
    search_fields = ["name", "short_description"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductConfigSectionInline]
    ordering = ["order", "name"]


@admin.register(ProductConfigSection)
class ProductConfigSectionAdmin(admin.ModelAdmin):
    list_display = ["name", "product", "step_number", "order"]
    list_filter = ["product"]
    inlines = [ProductConfigOptionInline]
