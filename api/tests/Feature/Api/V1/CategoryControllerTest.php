<?php

namespace Tests\Feature\Api\V1;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class CategoryControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_only_active_categories_with_active_product_counts(): void
    {
        $activeCategory = Category::factory()->create([
            'name' => 'Diamond Jewellery',
            'slug' => 'diamond-jewellery',
        ]);
        Category::factory()->inactive()->create();
        Product::factory()->for($activeCategory)->count(2)->create();
        Product::factory()->for($activeCategory)->inactive()->create();

        $response = $this->getJson('/api/v1/categories');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'diamond-jewellery')
            ->assertJsonPath('data.0.products_count', 2)
            ->assertJsonStructure([
                'data' => [[
                    'id',
                    'name',
                    'slug',
                    'description',
                    'image_url',
                    'is_active',
                    'products_count',
                ]],
            ]);
    }
}
