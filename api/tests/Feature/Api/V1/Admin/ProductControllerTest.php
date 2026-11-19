<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class ProductControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_can_create_component_priced_product_and_spoofed_price_is_ignored(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $payload = $this->componentPayload($category->id);
        $payload['price'] = 1;
        $payload['sale_price'] = 0.5;
        $payload['compare_at_price'] = 999999;

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/products', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('data.metal_type', 'Gold')
            ->assertJsonPath('data.price', 57165)
            ->assertJsonPath('data.final_price', 57165)
            ->assertJsonPath('data.sale_price', null)
            ->assertJsonPath('data.compare_at_price', null)
            ->assertJsonPath('data.price_breakdown.metal_value', 50000)
            ->assertJsonPath('data.price_breakdown.subtotal', 55500)
            ->assertJsonPath('data.price_breakdown.taxes.0.amount', 832.5)
            ->assertJsonPath('data.price_breakdown.taxes.1.amount', 832.5)
            ->assertJsonPath('data.price_breakdown.tax_total', 1665);
        $this->assertDatabaseHas('products', [
            'sku' => 'CL-CALC-001',
            'price' => 57165,
            'sale_price' => null,
            'compare_at_price' => null,
        ]);
    }

    public function test_admin_can_create_product_with_uploaded_image(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $payload = $this->componentPayload($category->id);
        $payload['image'] = UploadedFile::fake()->image('calculated-ring.jpg', 1200, 1200)->size(500);

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post('/api/v1/admin/products', $payload);

        $response->assertCreated();
        $product = Product::query()->where('sku', 'CL-CALC-001')->firstOrFail();
        $imagePath = $product->getRawOriginal('image_url');
        $response
            ->assertJsonPath('data.image_url', Storage::disk('public')->url($imagePath))
            ->assertJsonPath('data.images.0', Storage::disk('public')->url($imagePath));
        $this->assertSame([$imagePath], $product->images);
        Storage::disk('public')->assertExists($imagePath);
    }

    public function test_product_image_upload_rejects_non_image_file_with_422(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $payload = $this->componentPayload($category->id);
        $payload['image'] = UploadedFile::fake()->create('product.pdf', 100, 'application/pdf');

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post('/api/v1/admin/products', $payload);

        $response
            ->assertUnprocessable()
            ->assertInvalid(['image' => 'The image field must be an image.']);
        $this->assertDatabaseMissing('products', ['sku' => 'CL-CALC-001']);
    }

    public function test_product_image_upload_rejects_file_larger_than_five_megabytes_with_422(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $payload = $this->componentPayload($category->id);
        $payload['image'] = UploadedFile::fake()->image('product.jpg')->size(5121);

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post('/api/v1/admin/products', $payload);

        $response
            ->assertUnprocessable()
            ->assertInvalid(['image' => 'The image field must not be greater than 5120 kilobytes.']);
        $this->assertDatabaseMissing('products', ['sku' => 'CL-CALC-001']);
    }

    public function test_updating_pricing_component_recalculates_product_total(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create([
            'metal' => 'Gold',
            'weight_grams' => '10.000',
            'metal_price_per_gram' => '5000.00',
            'making_charges' => '5000.00',
            'shipping_charges' => '500.00',
            'taxes' => [
                ['name' => 'CGST', 'rate' => 1.5],
                ['name' => 'SGST', 'rate' => 1.5],
            ],
            'price' => '57165.00',
        ]);

        $response = $this->actingAs($admin)->patchJson(
            "/api/v1/admin/products/{$product->id}",
            ['weight_grams' => 12, 'price' => 1],
        );

        $response
            ->assertOk()
            ->assertJsonPath('data.price', 67465)
            ->assertJsonPath('data.price_breakdown.metal_value', 60000)
            ->assertJsonPath('data.price_breakdown.tax_total', 1965);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'weight_grams' => 12,
            'price' => 67465,
        ]);
    }

    public function test_multipart_method_spoofed_update_replaces_managed_product_image(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('products/old-product.jpg', 'old image');
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create([
            'image_url' => 'products/old-product.jpg',
            'images' => ['products/old-product.jpg'],
        ]);

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post("/api/v1/admin/products/{$product->id}", [
                '_method' => 'PATCH',
                'name' => 'Updated Product Name',
                'image' => UploadedFile::fake()->image('replacement.webp', 1000, 1000)->size(400),
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Product Name');
        $product->refresh();
        $imagePath = $product->getRawOriginal('image_url');
        $response
            ->assertJsonPath('data.image_url', Storage::disk('public')->url($imagePath))
            ->assertJsonPath('data.images.0', Storage::disk('public')->url($imagePath));
        $this->assertNotSame('products/old-product.jpg', $imagePath);
        $this->assertSame([$imagePath], $product->images);
        Storage::disk('public')->assertExists($imagePath);
        Storage::disk('public')->assertMissing('products/old-product.jpg');
    }

    public function test_update_without_new_image_preserves_existing_managed_product_image(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('products/current-product.jpg', 'current image');
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create([
            'image_url' => 'products/current-product.jpg',
            'images' => ['products/current-product.jpg'],
        ]);

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post("/api/v1/admin/products/{$product->id}", [
                '_method' => 'PATCH',
                'name' => 'Updated Without Image',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Without Image')
            ->assertJsonPath(
                'data.image_url',
                Storage::disk('public')->url('products/current-product.jpg'),
            );
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'image_url' => 'products/current-product.jpg',
        ]);
        Storage::disk('public')->assertExists('products/current-product.jpg');
    }

    public function test_replacing_external_product_image_never_deletes_external_url_from_public_storage(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create([
            'image_url' => 'https://images.example.com/external-product.jpg',
            'images' => ['https://images.example.com/external-product.jpg'],
        ]);
        $replacement = UploadedFile::fake()->image('replacement.jpg', 1000, 1000)->size(400);
        $filename = $replacement->hashName();
        $imagePath = "products/{$filename}";
        $imageUrl = "http://localhost/storage/{$imagePath}";
        $disk = Mockery::mock(FilesystemAdapter::class);
        $disk->expects('putFileAs')
            ->with('products', $replacement, $filename, [])
            ->andReturn($imagePath);
        $disk->expects('url')->twice()->with($imagePath)->andReturn($imageUrl);
        $disk->expects('delete')->never();
        Storage::set('public', $disk);

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post("/api/v1/admin/products/{$product->id}", [
                '_method' => 'PATCH',
                'image' => $replacement,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.image_url', $imageUrl);
        $this->assertSame($imagePath, $product->refresh()->getRawOriginal('image_url'));
    }

    public function test_component_pricing_requires_complete_valid_inputs(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $payload = $this->componentPayload($category->id);
        unset(
            $payload['metal_type'],
            $payload['weight_grams'],
            $payload['making_charges'],
            $payload['shipping_charges'],
            $payload['taxes'],
        );

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/products', $payload);

        $response
            ->assertUnprocessable()
            ->assertInvalid([
                'metal',
                'weight_grams',
                'making_charges',
                'shipping_charges',
                'taxes',
            ]);
        $this->assertDatabaseMissing('products', ['sku' => 'CL-CALC-001']);
    }

    public function test_component_pricing_rejects_duplicate_tax_names_and_rates_over_one_hundred(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $payload = $this->componentPayload($category->id);
        $payload['taxes'] = [
            ['name' => 'CGST', 'rate' => 1.5],
            ['name' => 'cgst', 'rate' => 101],
        ];

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/products', $payload);

        $response
            ->assertUnprocessable()
            ->assertInvalid(['taxes.1.name', 'taxes.1.rate']);
        $this->assertDatabaseMissing('products', ['sku' => 'CL-CALC-001']);
    }

    public function test_admin_can_view_and_delete_product(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();

        $this->actingAs($admin)
            ->getJson("/api/v1/admin/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $product->id);

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/products/{$product->id}")
            ->assertNoContent();
        $this->assertModelMissing($product);
    }

    public function test_deleting_product_removes_its_managed_image(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('products/deleted-product.jpg', 'deleted image');
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create([
            'image_url' => 'products/deleted-product.jpg',
            'images' => ['products/deleted-product.jpg'],
        ]);

        $response = $this
            ->actingAs($admin)
            ->deleteJson("/api/v1/admin/products/{$product->id}");

        $response->assertNoContent();
        $this->assertModelMissing($product);
        Storage::disk('public')->assertMissing('products/deleted-product.jpg');
    }

    public function test_deleting_product_with_external_image_does_not_access_public_storage(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create([
            'image_url' => 'https://images.example.com/external-product.jpg',
            'images' => ['https://images.example.com/external-product.jpg'],
        ]);
        Storage::expects('disk')->never();

        $response = $this
            ->actingAs($admin)
            ->deleteJson("/api/v1/admin/products/{$product->id}");

        $response->assertNoContent();
        $this->assertModelMissing($product);
    }

    public function test_returns_422_when_sale_price_exceeds_product_price(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create([
            'price' => '1000.00',
            'sale_price' => null,
        ]);

        $response = $this->actingAs($admin)->patchJson(
            "/api/v1/admin/products/{$product->id}",
            ['sale_price' => 1200],
        );

        $response
            ->assertUnprocessable()
            ->assertInvalid([
                'sale_price' => 'The sale price must be less than or equal to the price.',
            ]);
        $this->assertNull($product->refresh()->sale_price);
    }

    /**
     * @return array<string, mixed>
     */
    private function componentPayload(int $categoryId): array
    {
        return [
            'category_id' => $categoryId,
            'name' => 'Calculated Gold Ring',
            'slug' => 'calculated-gold-ring',
            'sku' => 'CL-CALC-001',
            'short_description' => 'A ring with server-calculated pricing.',
            'metal_type' => 'Gold',
            'purity' => '18K',
            'weight_grams' => 10,
            'metal_price_per_gram' => 5000,
            'making_charges' => 5000,
            'shipping_charges' => 500,
            'taxes' => [
                ['name' => 'CGST', 'rate' => 1.5],
                ['name' => 'SGST', 'rate' => 1.5],
            ],
            'stock' => 5,
            'is_active' => true,
        ];
    }
}
