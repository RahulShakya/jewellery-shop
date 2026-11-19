<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_number' => 'CL-'.now()->format('Y').'-'.Str::upper(Str::random(8)),
            'user_id' => null,
            'customer_name' => fake()->name(),
            'customer_phone' => fake()->numerify('9#########'),
            'customer_email' => fake()->safeEmail(),
            'shipping_address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'state' => fake()->state(),
            'pincode' => fake()->numerify('######'),
            'subtotal' => '1000.00',
            'gst_amount' => '30.00',
            'total_amount' => '1030.00',
            'payment_method' => 'cod',
            'payment_status' => 'pending_cod',
            'order_status' => 'placed',
            'notes' => null,
        ];
    }
}
