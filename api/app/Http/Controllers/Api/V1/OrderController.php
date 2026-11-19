<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = Order::query()
            ->whereBelongsTo($request->user())
            ->with(['items.product.category'])
            ->latest()
            ->orderByDesc('id')
            ->paginate(15);

        return OrderResource::collection($orders);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Order $order): OrderResource
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        return new OrderResource($order->load(['items.product.category']));
    }
}
