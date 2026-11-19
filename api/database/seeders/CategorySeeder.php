<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Gold Jewellery',
                'slug' => 'gold-jewellery',
                'description' => 'Hand-finished gold pieces for everyday elegance and celebrations.',
                'image_url' => 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0',
            ],
            [
                'name' => 'Diamond Jewellery',
                'slug' => 'diamond-jewellery',
                'description' => 'Contemporary diamond designs selected for exceptional brilliance.',
                'image_url' => 'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
            ],
            [
                'name' => 'Silver Jewellery',
                'slug' => 'silver-jewellery',
                'description' => 'Versatile sterling silver essentials with a modern finish.',
                'image_url' => 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                [...$category, 'is_active' => true],
            );
        }
    }
}
