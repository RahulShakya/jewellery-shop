<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\CalculateProductPrice;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreProductRequest;
use App\Http\Requests\Api\V1\Admin\UpdateProductRequest;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $query = Product::query()->with('category');

        if (isset($validated['search'])) {
            $search = $validated['search'];
            $query->where(function (Builder $query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if (isset($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        return ProductResource::collection(
            $query->latest()->orderByDesc('id')->paginate($request->integer('per_page', 20)),
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductRequest $request, CalculateProductPrice $calculateProductPrice): JsonResponse
    {
        $attributes = $request->validated();
        unset($attributes['image']);

        $image = $request->file('image');
        $imagePath = $image instanceof UploadedFile ? $this->storeProductImage($image) : null;

        if ($imagePath !== null) {
            $attributes['image_url'] = $imagePath;
            $attributes['images'] = [$imagePath];
        }

        try {
            $product = Product::create(
                $this->withCalculatedPrice($attributes, $calculateProductPrice),
            );
        } catch (Throwable $exception) {
            $this->deleteManagedImages(array_filter([$imagePath]));

            throw $exception;
        }

        return (new ProductResource($product->load('category')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load('category'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateProductRequest $request,
        Product $product,
        CalculateProductPrice $calculateProductPrice,
    ): ProductResource {
        $attributes = $request->validated();
        unset($attributes['image']);

        $image = $request->file('image');
        $imagePath = $image instanceof UploadedFile ? $this->storeProductImage($image) : null;
        $previousImagePaths = $imagePath === null ? [] : $this->managedImagePaths($product);

        if ($imagePath !== null) {
            $attributes['image_url'] = $imagePath;
            $attributes['images'] = [$imagePath];
        }

        try {
            $product->update(
                $this->withCalculatedPrice($attributes, $calculateProductPrice, $product),
            );
        } catch (Throwable $exception) {
            $this->deleteManagedImages(array_filter([$imagePath]));

            throw $exception;
        }

        $this->deleteManagedImages($previousImagePaths);

        return new ProductResource($product->refresh()->load('category'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): Response
    {
        $imagePaths = $this->managedImagePaths($product);
        $product->delete();
        $this->deleteManagedImages($imagePaths);

        return response()->noContent();
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function withCalculatedPrice(
        array $attributes,
        CalculateProductPrice $calculateProductPrice,
        ?Product $product = null,
    ): array {
        $pricingAttributes = $product === null
            ? $attributes
            : [
                ...$product->only([
                    'weight_grams',
                    'metal_price_per_gram',
                    'making_charges',
                    'shipping_charges',
                    'taxes',
                ]),
                ...$attributes,
            ];

        if (($pricingAttributes['metal_price_per_gram'] ?? null) === null) {
            return $attributes;
        }

        $taxes = collect($pricingAttributes['taxes'] ?? [])->map(fn (array $tax): array => [
            'name' => trim($tax['name']),
            'rate' => (float) $tax['rate'],
        ])->values()->all();
        $breakdown = $calculateProductPrice->handle(
            $pricingAttributes['weight_grams'],
            $pricingAttributes['metal_price_per_gram'],
            $pricingAttributes['making_charges'],
            $pricingAttributes['shipping_charges'],
            $taxes,
        );

        return [
            ...$attributes,
            'taxes' => $taxes,
            'price' => $breakdown['final_price'],
            'sale_price' => null,
            'compare_at_price' => null,
        ];
    }

    private function storeProductImage(UploadedFile $image): string
    {
        $path = $image->store('products', 'public');

        if (! is_string($path)) {
            throw new RuntimeException('The product image could not be stored.');
        }

        return $path;
    }

    /**
     * @return array<int, string>
     */
    private function managedImagePaths(Product $product): array
    {
        return collect([
            $product->getRawOriginal('image_url'),
            ...($product->images ?? []),
        ])->filter(function (mixed $path): bool {
            if (! is_string($path) || ! Str::startsWith($path, 'products/')) {
                return false;
            }

            $filename = Str::after($path, 'products/');

            return $filename !== ''
                && ! Str::contains($filename, ['..', '/', '\\']);
        })->unique()->values()->all();
    }

    /**
     * @param  array<int, string>  $paths
     */
    private function deleteManagedImages(array $paths): void
    {
        if ($paths !== []) {
            Storage::disk('public')->delete($paths);
        }
    }
}
