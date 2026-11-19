<?php

namespace App\Actions;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PlaceOrder
{
    public function __construct(private CalculateProductPrice $calculateProductPrice) {}

    /**
     * @param  array{
     *     customer_name: string,
     *     customer_phone: string,
     *     customer_email?: string|null,
     *     shipping_address: string,
     *     city: string,
     *     state?: string|null,
     *     pincode: string,
     *     notes?: string|null,
     *     items: array<int, array{product_id: int, quantity: int}>
     * }  $data
     */
    public function handle(array $data, User $user): Order
    {
        return DB::transaction(function () use ($data, $user): Order {
            $products = Product::query()
                ->with('category')
                ->whereIn('id', collect($data['items'])->pluck('product_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotalInPaise = 0;
            $taxTotalInPaise = 0;
            $totalInPaise = 0;
            $lineItems = [];

            foreach ($data['items'] as $index => $item) {
                $product = $products->get($item['product_id']);

                if (
                    ! $product instanceof Product
                    || ! $product->is_active
                    || ($product->category_id !== null && ! $product->category?->is_active)
                ) {
                    throw ValidationException::withMessages([
                        "items.{$index}.product_id" => ['This product is not available.'],
                    ]);
                }

                if ($product->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => ["Only {$product->stock} of {$product->name} are available."],
                    ]);
                }

                $pricingBreakdown = $this->calculateProductPrice->forProduct($product);
                $unitPriceInPaise = $pricingBreakdown === null
                    ? $this->toPaise($product->final_price)
                    : $this->toPaise($pricingBreakdown['final_price']);
                $unitSubtotalInPaise = $pricingBreakdown === null
                    ? $unitPriceInPaise
                    : $this->toPaise($pricingBreakdown['subtotal']);
                $unitTaxInPaise = $pricingBreakdown === null
                    ? 0
                    : $this->toPaise($pricingBreakdown['tax_total']);
                $lineTotalInPaise = $unitPriceInPaise * $item['quantity'];
                $subtotalInPaise += $unitSubtotalInPaise * $item['quantity'];
                $taxTotalInPaise += $unitTaxInPaise * $item['quantity'];
                $totalInPaise += $lineTotalInPaise;

                $product->decrement('stock', $item['quantity']);
                $lineItems[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $this->fromPaise($unitPriceInPaise),
                    'line_total' => $this->fromPaise($lineTotalInPaise),
                    'pricing_breakdown' => $pricingBreakdown,
                ];
            }

            $order = Order::create([
                'order_number' => 'CL-'.now()->format('Y').'-'.Str::upper(Str::random(8)),
                'user_id' => $user->id,
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_email' => $data['customer_email'] ?? null,
                'shipping_address' => $data['shipping_address'],
                'city' => $data['city'],
                'state' => $data['state'] ?? null,
                'pincode' => $data['pincode'],
                'subtotal' => $this->fromPaise($subtotalInPaise),
                'gst_amount' => $this->fromPaise($taxTotalInPaise),
                'total_amount' => $this->fromPaise($totalInPaise),
                'payment_method' => 'cod',
                'payment_status' => 'pending_cod',
                'order_status' => 'placed',
                'notes' => $data['notes'] ?? null,
            ]);

            $order->items()->createMany($lineItems);

            return $order->load(['items.product.category', 'user']);
        });
    }

    private function toPaise(string|int|float $amount): int
    {
        return (int) round((float) $amount * 100);
    }

    private function fromPaise(int $amount): string
    {
        return number_format($amount / 100, 2, '.', '');
    }
}
