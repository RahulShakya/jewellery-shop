<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'category_id',
    'name',
    'slug',
    'sku',
    'short_description',
    'description',
    'metal',
    'purity',
    'gemstone',
    'weight_grams',
    'metal_price_per_gram',
    'making_charges',
    'shipping_charges',
    'taxes',
    'price',
    'sale_price',
    'compare_at_price',
    'stock',
    'image_url',
    'images',
    'is_featured',
    'is_active',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    protected function casts(): array
    {
        return [
            'weight_grams' => 'decimal:3',
            'metal_price_per_gram' => 'decimal:2',
            'making_charges' => 'decimal:2',
            'shipping_charges' => 'decimal:2',
            'taxes' => 'array',
            'price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'stock' => 'integer',
            'images' => 'array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    protected function finalPrice(): Attribute
    {
        return Attribute::get(
            fn (): string => $this->metal_price_per_gram === null
                ? ($this->sale_price ?? $this->price)
                : $this->price,
        );
    }
}
