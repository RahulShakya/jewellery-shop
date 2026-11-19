<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreCategoryRequest;
use App\Http\Requests\Api\V1\Admin\UpdateCategoryRequest;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            Category::query()->withCount('products')->orderBy('name')->get(),
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $attributes = $request->validated();
        unset($attributes['image']);

        $image = $request->file('image');
        $imagePath = $image instanceof UploadedFile ? $this->storeCategoryImage($image) : null;

        if ($imagePath !== null) {
            $attributes['image_url'] = $imagePath;
        }

        try {
            $category = Category::create($attributes);
        } catch (Throwable $exception) {
            $this->deleteManagedImage($imagePath);

            throw $exception;
        }

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->loadCount('products'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        $attributes = $request->validated();
        unset($attributes['image']);

        $image = $request->file('image');
        $imagePath = $image instanceof UploadedFile ? $this->storeCategoryImage($image) : null;
        $previousImagePath = $imagePath === null ? null : $this->managedImagePath($category);

        if ($imagePath !== null) {
            $attributes['image_url'] = $imagePath;
        }

        try {
            $category->update($attributes);
        } catch (Throwable $exception) {
            $this->deleteManagedImage($imagePath);

            throw $exception;
        }

        $this->deleteManagedImage($previousImagePath);

        return new CategoryResource($category->refresh()->loadCount('products'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category): Response
    {
        $imagePath = $this->managedImagePath($category);
        $category->delete();
        $this->deleteManagedImage($imagePath);

        return response()->noContent();
    }

    private function storeCategoryImage(UploadedFile $image): string
    {
        $path = $image->store('categories', 'public');

        if (! is_string($path)) {
            throw new RuntimeException('The category image could not be stored.');
        }

        return $path;
    }

    private function managedImagePath(Category $category): ?string
    {
        $path = $category->getRawOriginal('image_url');

        if (! is_string($path) || ! Str::startsWith($path, 'categories/')) {
            return null;
        }

        $filename = Str::after($path, 'categories/');

        return $filename !== '' && ! Str::contains($filename, ['..', '/', '\\'])
            ? $path
            : null;
    }

    private function deleteManagedImage(?string $path): void
    {
        if ($path !== null) {
            Storage::disk('public')->delete($path);
        }
    }
}
