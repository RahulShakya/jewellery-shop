<?php

namespace Tests\Feature\Http\Middleware;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class EnsureAdminTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_401_for_unauthenticated_admin_request(): void
    {
        $response = $this->getJson('/api/v1/admin/products');

        $response->assertUnauthorized();
    }

    public function test_returns_403_for_customer_admin_request(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->getJson('/api/v1/admin/products');

        $response
            ->assertForbidden()
            ->assertJsonPath('message', 'Administrator access is required.');
    }

    public function test_allows_admin_to_list_catalog_resources(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/products');

        $response
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    public function test_allows_admin_to_update_order_status(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create();

        $response = $this->actingAs($admin)->patchJson(
            "/api/v1/admin/orders/{$order->id}/status",
            ['order_status' => 'confirmed'],
        );

        $response
            ->assertOk()
            ->assertJsonPath('data.order_status', 'confirmed');
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'order_status' => 'confirmed',
        ]);
    }
}
