<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);
        $image = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338';

        return [
            'category_id' => Category::factory(),
            'name' => str($name)->title()->toString(),
            'slug' => str($name)->slug()->toString(),
            'sku' => 'CL-'.fake()->unique()->numerify('######'),
            'short_description' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'metal' => fake()->randomElement(['Gold', 'Silver', 'Platinum']),
            'purity' => fake()->randomElement(['18K', '22K', '925']),
            'gemstone' => fake()->optional()->randomElement(['Diamond', 'Ruby', 'Emerald']),
            'weight_grams' => fake()->randomFloat(3, 1, 30),
            'metal_price_per_gram' => null,
            'making_charges' => 0,
            'shipping_charges' => 0,
            'taxes' => null,
            'price' => fake()->randomFloat(2, 2500, 150000),
            'sale_price' => null,
            'compare_at_price' => null,
            'stock' => fake()->numberBetween(1, 25),
            'image_url' => $image,
            'images' => [$image],
            'is_featured' => false,
            'is_active' => true,
        ];
    }

    public function featured(): static
    {
        return $this->state(fn (): array => ['is_featured' => true]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (): array => ['stock' => 0]);
    }
}
