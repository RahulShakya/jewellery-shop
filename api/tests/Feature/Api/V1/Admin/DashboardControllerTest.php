<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_receives_complete_dashboard_aggregates(): void
    {
        $admin = User::factory()->admin()->create();
        Product::factory()->create(['stock' => 3]);
        Product::factory()->create(['stock' => 10]);
        Product::factory()->inactive()->create(['stock' => 1]);
        Order::factory()->create([
            'customer_email' => 'first@example.com',
            'customer_phone' => '9000000001',
            'total_amount' => '1000.00',
            'order_status' => 'placed',
            'payment_status' => 'pending_cod',
        ]);
        Order::factory()->create([
            'customer_email' => 'second@example.com',
            'customer_phone' => '9000000002',
            'total_amount' => '2000.00',
            'order_status' => 'delivered',
            'payment_status' => 'collected',
        ]);
        Order::factory()->create([
            'customer_email' => 'first@example.com',
            'customer_phone' => '9000000001',
            'total_amount' => '500.00',
            'order_status' => 'confirmed',
            'payment_status' => 'collected',
        ]);
        Order::factory()->create([
            'customer_email' => null,
            'customer_phone' => '9000000003',
            'total_amount' => '3000.00',
            'order_status' => 'cancelled',
            'payment_status' => 'failed',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/dashboard');

        $response
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'total_products' => 3,
                    'active_products' => 2,
                    'low_stock_products' => 1,
                    'total_orders' => 4,
                    'placed_orders' => 1,
                    'customer_count' => 3,
                    'order_revenue' => 3500,
                    'collected_revenue' => 2500,
                ],
            ]);
    }

    public function test_returns_403_when_customer_requests_dashboard(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->getJson('/api/v1/admin/dashboard');

        $response->assertForbidden();
    }

    public function test_returns_401_when_guest_requests_dashboard(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertUnauthorized();
    }
}
