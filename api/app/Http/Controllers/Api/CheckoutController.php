<?php

namespace App\Http\Controllers\Api;

use App\Actions\PlaceOrder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CheckoutRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    public function store(CheckoutRequest $request, PlaceOrder $placeOrder): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $order = $placeOrder->handle($request->validated(), $user);

        return response()->json([
            'message' => 'Order placed successfully with Cash on Delivery.',
            'order' => new OrderResource($order),
        ], 201);
    }
}
