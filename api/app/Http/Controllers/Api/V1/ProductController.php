<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductIndexRequest;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(ProductIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();
        $query = $this->activeCatalogQuery()->with('category');

        if (isset($validated['search'])) {
            $search = $validated['search'];
            $query->where(function (Builder $query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        if (isset($validated['category'])) {
            $query->whereHas('category', fn (Builder $category) => $category->where('slug', $validated['category']));
        }

        if (isset($validated['metal'])) {
            $query->whereRaw('LOWER(metal) = ?', [Str::lower($validated['metal'])]);
        }

        if (isset($validated['min_price'])) {
            $query->where(function (Builder $query) use ($validated): void {
                $query->where(function (Builder $sale) use ($validated): void {
                    $sale->whereNotNull('sale_price')->where('sale_price', '>=', $validated['min_price']);
                })->orWhere(function (Builder $regular) use ($validated): void {
                    $regular->whereNull('sale_price')->where('price', '>=', $validated['min_price']);
                });
            });
        }

        if (isset($validated['max_price'])) {
            $query->where(function (Builder $query) use ($validated): void {
                $query->where(function (Builder $sale) use ($validated): void {
                    $sale->whereNotNull('sale_price')->where('sale_price', '<=', $validated['max_price']);
                })->orWhere(function (Builder $regular) use ($validated): void {
                    $regular->whereNull('sale_price')->where('price', '<=', $validated['max_price']);
                });
            });
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        match ($validated['sort'] ?? 'featured') {
            'price-asc' => $query->orderByRaw('COALESCE(sale_price, price) ASC')->orderBy('id'),
            'price-desc' => $query->orderByRaw('COALESCE(sale_price, price) DESC')->orderByDesc('id'),
            'name-asc' => $query->orderBy('name')->orderBy('id'),
            'name-desc' => $query->orderByDesc('name')->orderByDesc('id'),
            'newest' => $query->latest()->orderByDesc('id'),
            default => $query->orderByDesc('is_featured')->latest()->orderByDesc('id'),
        };

        return ProductResource::collection(
            $query->paginate($request->integer('per_page', 12))->withQueryString(),
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product): ProductResource
    {
        $product->load('category');

        abort_unless($product->is_active && ($product->category_id === null || $product->category?->is_active), 404);

        return new ProductResource($product);
    }

    public function filterOptions(): JsonResponse
    {
        $metals = $this->activeCatalogQuery()
            ->whereNotNull('metal')
            ->where('metal', '<>', '')
            ->pluck('metal')
            ->unique(fn (string $metal): string => Str::lower($metal))
            ->sortBy(fn (string $metal): string => Str::lower($metal))
            ->values();

        return response()->json([
            'data' => [
                'metals' => $metals,
            ],
        ]);
    }

    private function activeCatalogQuery(): Builder
    {
        return Product::query()
            ->where('is_active', true)
            ->where(function (Builder $query): void {
                $query->whereNull('category_id')
                    ->orWhereHas('category', fn (Builder $category) => $category->where('is_active', true));
            });
    }
}
