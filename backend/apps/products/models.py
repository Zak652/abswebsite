import uuid

from django.db import models


class ProductCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "product_category"
        ordering = ["order", "name"]
        verbose_name_plural = "product categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        ProductCategory, on_delete=models.PROTECT, related_name="products"
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    short_description = models.CharField(max_length=400)
    full_description = models.TextField(blank=True)
    image_hero = models.CharField(max_length=500, blank=True)
    image_context = models.CharField(max_length=500, blank=True)
    image_detail = models.CharField(max_length=500, blank=True)
    image_usecase = models.CharField(max_length=500, blank=True)
    specifications = models.JSONField(default=dict)
    is_configurable = models.BooleanField(default=False)
    is_recommended = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    datasheet_url = models.CharField(max_length=500, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "product"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class ProductConfigSection(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="config_sections"
    )
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    step_number = models.IntegerField(default=1)

    class Meta:
        db_table = "product_config_section"
        ordering = ["order"]

    def __str__(self):
        return f"{self.product.name} — {self.name}"


class ProductConfigOption(models.Model):
    section = models.ForeignKey(
        ProductConfigSection, on_delete=models.CASCADE, related_name="options"
    )
    option_id = models.CharField(max_length=50)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price_usd = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    badge = models.CharField(max_length=50, blank=True)
    is_default = models.BooleanField(default=False)
    overlay_icon = models.CharField(max_length=50, blank=True)
    overlay_label = models.CharField(max_length=100, blank=True)
    overlay_position = models.CharField(max_length=100, blank=True)
    overlay_color = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "product_config_option"
        ordering = ["order"]

    def __str__(self):
        return f"{self.section.name} — {self.name}"
