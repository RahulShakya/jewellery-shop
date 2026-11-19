<?php

namespace Tests\Feature\Api;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class CheckoutControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_component_price_checkout_snapshots_breakdown_without_double_taxing(): void
    {
        $customer = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Aurelia Gold Hoops',
            'sku' => 'CL-GO-001',
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
            'sale_price' => null,
            'stock' => 5,
        ]);

        $response = $this
            ->actingAs($customer)
            ->postJson('/api/v1/orders', $this->validPayload($product->id, 2));

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Order placed successfully with Cash on Delivery.')
            ->assertJsonPath('order.subtotal', 4300)
            ->assertJsonPath('order.gst_amount', 129)
            ->assertJsonPath('order.tax_amount', 129)
            ->assertJsonPath('order.total_amount', 4429)
            ->assertJsonPath('order.payment_method', 'cod')
            ->assertJsonPath('order.order_status', 'placed')
            ->assertJsonPath('order.items.0.product_name', 'Aurelia Gold Hoops')
            ->assertJsonPath('order.items.0.unit_price', 2214.5)
            ->assertJsonPath('order.items.0.line_total', 4429)
            ->assertJsonPath('order.items.0.pricing_breakdown.tax_total', 64.5);

        $this->assertDatabaseHas('orders', [
            'customer_email' => 'customer@example.com',
            'subtotal' => 4300,
            'gst_amount' => 129,
            'total_amount' => 4429,
            'user_id' => $customer->id,
        ]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 2214.5,
            'line_total' => 4429,
        ]);
        $orderItem = OrderItem::query()->firstOrFail();
        $this->assertSame(2150, $orderItem->pricing_breakdown['subtotal']);
        $this->assertSame(64.5, $orderItem->pricing_breakdown['tax_total']);
        $this->assertSame('CGST', $orderItem->pricing_breakdown['taxes'][0]['name']);
        $this->assertSame(3, $product->refresh()->stock);
    }

    public function test_legacy_product_uses_stored_final_price_without_adding_tax(): void
    {
        $customer = User::factory()->create();
        $product = Product::factory()->create([
            'price' => '1000.00',
            'sale_price' => '900.00',
            'metal_price_per_gram' => null,
            'stock' => 5,
        ]);

        $response = $this
            ->actingAs($customer)
            ->postJson('/api/v1/orders', $this->validPayload($product->id, 2));

        $response
            ->assertCreated()
            ->assertJsonPath('order.subtotal', 1800)
            ->assertJsonPath('order.gst_amount', 0)
            ->assertJsonPath('order.total_amount', 1800)
            ->assertJsonPath('order.items.0.pricing_breakdown', null);
    }

    public function test_returns_422_for_missing_checkout_fields_without_creating_order(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/v1/orders', []);

        $response
            ->assertUnprocessable()
            ->assertInvalid([
                'customer_name' => 'The customer name field is required.',
                'customer_phone',
                'shipping_address',
                'city',
                'pincode',
                'payment_method',
                'items',
            ]);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_returns_422_for_insufficient_stock_and_rolls_back_order(): void
    {
        $customer = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Limited Diamond Ring',
            'stock' => 1,
        ]);

        $response = $this
            ->actingAs($customer)
            ->postJson('/api/v1/orders', $this->validPayload($product->id, 2));

        $response
            ->assertUnprocessable()
            ->assertInvalid([
                'items.0.quantity' => 'Only 1 of Limited Diamond Ring are available.',
            ]);
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertSame(1, $product->refresh()->stock);
    }

    public function test_returns_401_for_unauthenticated_checkout_without_creating_order(): void
    {
        $product = Product::factory()->create(['stock' => 5]);

        $response = $this->postJson('/api/v1/orders', $this->validPayload($product->id, 1));

        $response->assertUnauthorized();
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertSame(5, $product->refresh()->stock);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $productId, int $quantity): array
    {
        return [
            'customer_name' => 'Aarav Sharma',
            'customer_phone' => '+91 9876543210',
            'customer_email' => 'customer@example.com',
            'shipping_address' => '21 Rose Garden Road',
            'city' => 'Jaipur',
            'pincode' => '302001',
            'payment_method' => 'cod',
            'items' => [
                ['product_id' => $productId, 'quantity' => $quantity],
            ],
        ];
    }
}
