<?php

namespace Database\Seeders;

use App\Actions\CalculateProductPrice;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@caratline.test'],
            [
                'name' => 'CaratLine Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'customer@caratline.test'],
            [
                'name' => 'Demo Customer',
                'password' => Hash::make('password'),
                'role' => 'customer',
                'email_verified_at' => now(),
            ],
        );

        $this->call(CategorySeeder::class);

        $categories = Category::query()->pluck('id', 'slug');
        $products = [
            [
                'category' => 'gold-jewellery',
                'name' => 'Aurelia Gold Hoops',
                'slug' => 'aurelia-gold-hoops',
                'sku' => 'CL-GO-001',
                'short_description' => 'Sculpted 18K gold hoops with a softly polished finish.',
                'description' => 'Lightweight statement hoops designed for all-day comfort and a warm, luminous finish.',
                'metal' => 'Gold',
                'purity' => '18K',
                'gemstone' => null,
                'weight_grams' => 6.250,
                'price' => 48900,
                'compare_at_price' => 52900,
                'stock' => 12,
                'image_url' => 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
                'is_featured' => true,
            ],
            [
                'category' => 'gold-jewellery',
                'name' => 'Meher Layered Necklace',
                'slug' => 'meher-layered-necklace',
                'sku' => 'CL-GN-002',
                'short_description' => 'A delicate 22K gold necklace with graceful layered chains.',
                'description' => 'A refined layered silhouette made to sit beautifully along the collarbone.',
                'metal' => 'Gold',
                'purity' => '22K',
                'gemstone' => null,
                'weight_grams' => 11.800,
                'price' => 82900,
                'compare_at_price' => null,
                'stock' => 7,
                'image_url' => 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f',
                'is_featured' => true,
            ],
            [
                'category' => 'gold-jewellery',
                'name' => 'Nira Gold Bangle',
                'slug' => 'nira-gold-bangle',
                'sku' => 'CL-GB-003',
                'short_description' => 'A clean-lined 22K bangle with subtle hand-etched detail.',
                'description' => 'Traditional gold craftsmanship interpreted with a restrained contemporary pattern.',
                'metal' => 'Gold',
                'purity' => '22K',
                'gemstone' => null,
                'weight_grams' => 18.400,
                'price' => 126500,
                'compare_at_price' => 132000,
                'stock' => 4,
                'image_url' => 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a',
                'is_featured' => false,
            ],
            [
                'category' => 'diamond-jewellery',
                'name' => 'Celeste Diamond Ring',
                'slug' => 'celeste-diamond-ring',
                'sku' => 'CL-DR-004',
                'short_description' => 'A brilliant-cut diamond framed by a fine 18K gold band.',
                'description' => 'An elegant solitaire-inspired ring balanced for daily wear and milestone moments.',
                'metal' => 'Gold',
                'purity' => '18K',
                'gemstone' => 'Diamond',
                'weight_grams' => 4.100,
                'price' => 76500,
                'compare_at_price' => 82000,
                'stock' => 8,
                'image_url' => 'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
                'is_featured' => true,
            ],
            [
                'category' => 'diamond-jewellery',
                'name' => 'Elara Diamond Pendant',
                'slug' => 'elara-diamond-pendant',
                'sku' => 'CL-DP-005',
                'short_description' => 'A luminous diamond pendant on an adjustable 18K chain.',
                'description' => 'A minimal pendant that catches the light from every angle without overpowering the wearer.',
                'metal' => 'Gold',
                'purity' => '18K',
                'gemstone' => 'Diamond',
                'weight_grams' => 5.750,
                'price' => 64900,
                'compare_at_price' => null,
                'stock' => 10,
                'image_url' => 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e',
                'is_featured' => true,
            ],
            [
                'category' => 'diamond-jewellery',
                'name' => 'Veda Diamond Studs',
                'slug' => 'veda-diamond-studs',
                'sku' => 'CL-DE-006',
                'short_description' => 'Classic diamond studs set in secure 18K gold baskets.',
                'description' => 'Essential diamond studs with balanced proportions and secure everyday fastenings.',
                'metal' => 'Gold',
                'purity' => '18K',
                'gemstone' => 'Diamond',
                'weight_grams' => 2.900,
                'price' => 55900,
                'compare_at_price' => 59900,
                'stock' => 14,
                'image_url' => 'https://images.unsplash.com/photo-1635767798638-3e25273a8236',
                'is_featured' => false,
            ],
            [
                'category' => 'silver-jewellery',
                'name' => 'Luna Silver Cuff',
                'slug' => 'luna-silver-cuff',
                'sku' => 'CL-SB-007',
                'short_description' => 'A fluid sterling silver cuff with a mirror-bright edge.',
                'description' => 'An easy open cuff shaped for a comfortable fit and polished for modern shine.',
                'metal' => 'Silver',
                'purity' => '925',
                'gemstone' => null,
                'weight_grams' => 21.500,
                'price' => 6900,
                'compare_at_price' => 7900,
                'stock' => 20,
                'image_url' => 'https://images.unsplash.com/photo-1611652022419-a9419f74343d',
                'is_featured' => true,
            ],
            [
                'category' => 'silver-jewellery',
                'name' => 'Tara Moonstone Ring',
                'slug' => 'tara-moonstone-ring',
                'sku' => 'CL-SR-008',
                'short_description' => 'A moonstone cabochon held in a handcrafted sterling silver setting.',
                'description' => 'A softly iridescent moonstone ring with an organic bezel and a slender silver band.',
                'metal' => 'Silver',
                'purity' => '925',
                'gemstone' => 'Moonstone',
                'weight_grams' => 6.300,
                'price' => 4800,
                'compare_at_price' => null,
                'stock' => 16,
                'image_url' => 'https://images.unsplash.com/photo-1603561596112-db1d31420a9a',
                'is_featured' => false,
            ],
        ];

        foreach ($products as $product) {
            $category = $product['category'];
            unset($product['category']);
            $metalPricePerGram = match ($product['metal']) {
                'Gold' => 7000,
                'Platinum' => 3500,
                default => 95,
            };
            $shippingCharges = $product['metal'] === 'Silver' ? 250 : 500;
            $taxes = [
                ['name' => 'CGST', 'rate' => 1.5],
                ['name' => 'SGST', 'rate' => 1.5],
            ];
            $metalValue = (float) $product['weight_grams'] * $metalPricePerGram;
            $makingCharges = max(
                0,
                round(((float) $product['price'] / 1.03) - $metalValue - $shippingCharges, 2),
            );
            $priceBreakdown = (new CalculateProductPrice)->handle(
                $product['weight_grams'],
                $metalPricePerGram,
                $makingCharges,
                $shippingCharges,
                $taxes,
            );
            $product['metal_price_per_gram'] = $metalPricePerGram;
            $product['making_charges'] = $makingCharges;
            $product['shipping_charges'] = $shippingCharges;
            $product['taxes'] = $taxes;
            $product['price'] = $priceBreakdown['final_price'];
            $product['sale_price'] = null;
            $product['compare_at_price'] = null;

            Product::updateOrCreate(
                ['sku' => $product['sku']],
                [
                    ...$product,
                    'category_id' => $categories[$category],
                    'images' => [$product['image_url']],
                    'is_active' => true,
                ],
            );
        }
    }
}
