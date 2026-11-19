<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CategoryControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_can_create_category_with_uploaded_image(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post('/api/v1/admin/categories', [
                ...$this->validPayload(),
                'image' => UploadedFile::fake()->image('gold-rings.jpg', 1200, 1200)->size(500),
            ]);

        $response->assertCreated();
        $category = Category::query()->where('slug', 'gold-rings')->firstOrFail();
        $imagePath = $category->getRawOriginal('image_url');
        $response->assertJsonPath('data.image_url', Storage::disk('public')->url($imagePath));
        Storage::disk('public')->assertExists($imagePath);
    }

    public function test_category_image_upload_rejects_non_image_file(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post('/api/v1/admin/categories', [
                ...$this->validPayload(),
                'image' => UploadedFile::fake()->create('category.pdf', 100, 'application/pdf'),
            ]);

        $response->assertUnprocessable()->assertInvalid(['image']);
        $this->assertDatabaseMissing('categories', ['slug' => 'gold-rings']);
    }

    public function test_category_image_upload_rejects_file_larger_than_five_megabytes(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post('/api/v1/admin/categories', [
                ...$this->validPayload(),
                'image' => UploadedFile::fake()->image('category.jpg')->size(5121),
            ]);

        $response->assertUnprocessable()->assertInvalid(['image']);
        $this->assertDatabaseMissing('categories', ['slug' => 'gold-rings']);
    }

    public function test_multipart_update_replaces_managed_category_image(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('categories/old-category.jpg', 'old image');
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create(['image_url' => 'categories/old-category.jpg']);

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post("/api/v1/admin/categories/{$category->id}", [
                '_method' => 'PATCH',
                'name' => 'Updated Category',
                'image' => UploadedFile::fake()->image('replacement.webp', 1000, 1000)->size(400),
            ]);

        $response->assertOk()->assertJsonPath('data.name', 'Updated Category');
        $category->refresh();
        $imagePath = $category->getRawOriginal('image_url');
        $response->assertJsonPath('data.image_url', Storage::disk('public')->url($imagePath));
        $this->assertNotSame('categories/old-category.jpg', $imagePath);
        Storage::disk('public')->assertExists($imagePath);
        Storage::disk('public')->assertMissing('categories/old-category.jpg');
    }

    public function test_update_without_new_image_preserves_existing_category_image(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('categories/current-category.jpg', 'current image');
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create(['image_url' => 'categories/current-category.jpg']);

        $response = $this
            ->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post("/api/v1/admin/categories/{$category->id}", [
                '_method' => 'PATCH',
                'name' => 'Updated Without Image',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.image_url',
                Storage::disk('public')->url('categories/current-category.jpg'),
            );
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'image_url' => 'categories/current-category.jpg',
        ]);
        Storage::disk('public')->assertExists('categories/current-category.jpg');
    }

    public function test_deleting_category_removes_its_managed_image(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('categories/deleted-category.jpg', 'deleted image');
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create(['image_url' => 'categories/deleted-category.jpg']);

        $response = $this
            ->actingAs($admin)
            ->deleteJson("/api/v1/admin/categories/{$category->id}");

        $response->assertNoContent();
        $this->assertModelMissing($category);
        Storage::disk('public')->assertMissing('categories/deleted-category.jpg');
    }

    public function test_deleting_category_with_external_image_does_not_access_public_storage(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create([
            'image_url' => 'https://images.example.com/external-category.jpg',
        ]);
        Storage::expects('disk')->never();

        $response = $this
            ->actingAs($admin)
            ->deleteJson("/api/v1/admin/categories/{$category->id}");

        $response->assertNoContent();
        $this->assertModelMissing($category);
    }

    /**
     * @return array<string, string|bool>
     */
    private function validPayload(): array
    {
        return [
            'name' => 'Gold Rings',
            'slug' => 'gold-rings',
            'description' => 'Fine gold rings.',
            'is_active' => true,
        ];
    }
}
