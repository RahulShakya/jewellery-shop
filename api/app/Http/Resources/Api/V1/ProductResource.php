<?php

namespace App\Http\Resources\Api\V1;

use App\Actions\CalculateProductPrice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $price = (float) $this->price;
        $salePrice = $this->metal_price_per_gram !== null || $this->sale_price === null
            ? null
            : (float) $this->sale_price;
        $compareAtPrice = $this->metal_price_per_gram !== null
            ? null
            : ($this->compare_at_price === null
                ? ($salePrice === null ? null : $price)
                : (float) $this->compare_at_price);
        $taxes = collect($this->taxes ?? [])->map(fn (array $tax): array => [
            'name' => $tax['name'],
            'rate' => (float) $tax['rate'],
        ])->values()->all();
        $priceBreakdown = (new CalculateProductPrice)->forProduct($this->resource);
        $imageUrl = $this->resolveImageUrl($this->image_url);

        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'price' => $price,
            'sale_price' => $salePrice,
            'final_price' => (float) $this->final_price,
            'compare_at_price' => $compareAtPrice,
            'stock' => $this->stock,
            'in_stock' => $this->stock > 0,
            'image_url' => $imageUrl,
            'image' => $imageUrl,
            'images' => collect($this->images ?? [])
                ->map(fn (mixed $image): ?string => is_string($image) ? $this->resolveImageUrl($image) : null)
                ->filter()
                ->values()
                ->all(),
            'material' => $this->metal,
            'metal' => $this->metal,
            'metal_type' => $this->metal,
            'purity' => $this->purity,
            'gemstone' => $this->gemstone,
            'weight' => $this->weight_grams,
            'weight_grams' => $this->weight_grams,
            'metal_price_per_gram' => $this->metal_price_per_gram === null
                ? null
                : (float) $this->metal_price_per_gram,
            'making_charges' => (float) $this->making_charges,
            'shipping_charges' => (float) $this->shipping_charges,
            'taxes' => $taxes,
            'price_breakdown' => $priceBreakdown,
            'available' => $this->is_active && $this->stock > 0,
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    private function resolveImageUrl(?string $image): ?string
    {
        if ($image === null || $image === '') {
            return null;
        }

        if (Str::startsWith($image, ['http://', 'https://', '/'])) {
            return $image;
        }

        return Storage::disk('public')->url($image);
    }
}
