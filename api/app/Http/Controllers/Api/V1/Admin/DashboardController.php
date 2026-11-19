<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $products = Product::query()
            ->toBase()
            ->selectRaw('COUNT(*) AS total_products')
            ->selectRaw('SUM(CASE WHEN is_active = ? THEN 1 ELSE 0 END) AS active_products', [true])
            ->selectRaw('SUM(CASE WHEN is_active = ? AND stock <= ? THEN 1 ELSE 0 END) AS low_stock_products', [true, 5])
            ->first();

        $orders = Order::query()
            ->toBase()
            ->selectRaw('COUNT(*) AS total_orders')
            ->selectRaw('SUM(CASE WHEN order_status = ? THEN 1 ELSE 0 END) AS placed_orders', ['placed'])
            ->selectRaw('COALESCE(SUM(CASE WHEN order_status != ? THEN total_amount ELSE 0 END), 0) AS order_revenue', ['cancelled'])
            ->selectRaw('COALESCE(SUM(CASE WHEN payment_status = ? THEN total_amount ELSE 0 END), 0) AS collected_revenue', ['collected'])
            ->selectRaw("COUNT(DISTINCT COALESCE(NULLIF(customer_email, ''), customer_phone)) AS customer_count")
            ->first();

        return response()->json([
            'data' => [
                'total_products' => (int) $products->total_products,
                'active_products' => (int) $products->active_products,
                'low_stock_products' => (int) $products->low_stock_products,
                'total_orders' => (int) $orders->total_orders,
                'placed_orders' => (int) $orders->placed_orders,
                'customer_count' => (int) $orders->customer_count,
                'order_revenue' => (float) $orders->order_revenue,
                'collected_revenue' => (float) $orders->collected_revenue,
            ],
        ]);
    }
}
