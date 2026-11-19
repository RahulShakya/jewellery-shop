<?php

namespace Tests\Feature\Api\V1;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ProductControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_paginated_active_catalog_with_expected_resource_shape(): void
    {
        $category = Category::factory()->create([
            'name' => 'Gold Jewellery',
            'slug' => 'gold-jewellery',
        ]);
        Product::factory()->for($category)->featured()->create([
            'name' => 'Aurelia Gold Hoops',
            'slug' => 'aurelia-gold-hoops',
            'metal' => 'Gold',
            'price' => '5000.00',
            'sale_price' => '4500.00',
        ]);
        Product::factory()->for($category)->inactive()->create();

        $response = $this->getJson('/api/v1/products');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'aurelia-gold-hoops')
            ->assertJsonPath('data.0.final_price', 4500)
            ->assertJsonPath('data.0.material', 'Gold')
            ->assertJsonPath('data.0.category.slug', 'gold-jewellery')
            ->assertJsonStructure([
                'data' => [[
                    'id',
                    'name',
                    'slug',
                    'price',
                    'sale_price',
                    'final_price',
                    'stock',
                    'image_url',
                    'material',
                    'purity',
                    'weight',
                    'is_featured',
                    'category',
                ]],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    public function test_filters_products_by_search_category_and_final_price(): void
    {
        $diamond = Category::factory()->create(['slug' => 'diamond-jewellery']);
        $gold = Category::factory()->create(['slug' => 'gold-jewellery']);
        Product::factory()->for($diamond)->create([
            'name' => 'Aura Diamond Ring',
            'slug' => 'aura-diamond-ring',
            'price' => '12000.00',
            'sale_price' => '10000.00',
        ]);
        Product::factory()->for($diamond)->create([
            'name' => 'Classic Diamond Ring',
            'price' => '20000.00',
        ]);
        Product::factory()->for($gold)->create([
            'name' => 'Aura Gold Ring',
            'price' => '10000.00',
        ]);

        $response = $this->getJson(
            '/api/v1/products?search=Aura&category=diamond-jewellery&min_price=9000&max_price=11000&sort=price-asc',
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'aura-diamond-ring');
    }

    public function test_filters_by_metal_and_sorts_names_in_both_directions(): void
    {
        Product::factory()->create(['name' => 'Zoya Gold Ring', 'metal' => 'Gold']);
        Product::factory()->create(['name' => 'Aarya Gold Ring', 'metal' => 'Gold']);
        Product::factory()->create(['name' => 'Mira Silver Ring', 'metal' => 'Silver']);

        $ascending = $this->getJson('/api/v1/products?metal=gold&sort=name-asc');
        $descending = $this->getJson('/api/v1/products?metal=Gold&sort=name-desc');

        $ascending
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Aarya Gold Ring')
            ->assertJsonPath('data.1.name', 'Zoya Gold Ring');
        $descending
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Zoya Gold Ring')
            ->assertJsonPath('data.1.name', 'Aarya Gold Ring');
    }

    public function test_filter_options_returns_unique_metals_from_active_catalog_only(): void
    {
        Product::factory()->create(['metal' => 'Gold']);
        Product::factory()->create(['metal' => 'gold']);
        Product::factory()->create(['metal' => 'Silver']);
        Product::factory()->inactive()->create(['metal' => 'Platinum']);

        $response = $this->getJson('/api/v1/products/filter-options');

        $response
            ->assertOk()
            ->assertJsonPath('data.metals', ['Gold', 'Silver']);
    }

    public function test_returns_server_calculated_price_breakdown_and_availability(): void
    {
        Product::factory()->create([
            'metal' => 'Gold',
            'weight_grams' => '2.000',
            'metal_price_per_gram' => '1000.00',
            'making_charges' => '100.00',
            'shipping_charges' => '50.00',
            'taxes' => [
                ['name' => 'CGST', 'rate' => 1.5],
                ['name' => 'SGST', 'rate' => 1.5],
            ],
            'price' => '2214.50',
            'stock' => 2,
        ]);

        $response = $this->getJson('/api/v1/products');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.metal_type', 'Gold')
            ->assertJsonPath('data.0.available', true)
            ->assertJsonPath('data.0.price_breakdown.subtotal', 2150)
            ->assertJsonPath('data.0.price_breakdown.tax_total', 64.5)
            ->assertJsonPath('data.0.price_breakdown.final_price', 2214.5);
    }

    public function test_returns_active_product_detail_by_slug(): void
    {
        $product = Product::factory()->create([
            'name' => 'Celeste Diamond Ring',
            'slug' => 'celeste-diamond-ring',
        ]);

        $response = $this->getJson('/api/v1/products/celeste-diamond-ring');

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $product->id)
            ->assertJsonPath('data.slug', 'celeste-diamond-ring');
    }

    public function test_returns_404_for_inactive_product_detail(): void
    {
        Product::factory()->inactive()->create(['slug' => 'hidden-ring']);

        $response = $this->getJson('/api/v1/products/hidden-ring');

        $response->assertNotFound();
    }
}
