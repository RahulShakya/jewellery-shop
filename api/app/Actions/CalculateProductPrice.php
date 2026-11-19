<?php

namespace App\Actions;

use App\Models\Product;

class CalculateProductPrice
{
    /**
     * @param  array<int, array{name: string, rate: int|float|string}>  $taxes
     * @return array{
     *     metal_value: float,
     *     making_charges: float,
     *     shipping_charges: float,
     *     subtotal: float,
     *     taxes: array<int, array{name: string, rate: float, amount: float}>,
     *     tax_total: float,
     *     final_price: float
     * }
     */
    public function handle(
        string|int|float $weightGrams,
        string|int|float $metalPricePerGram,
        string|int|float $makingCharges,
        string|int|float $shippingCharges,
        array $taxes,
    ): array {
        $metalValueInPaise = $this->toPaise((float) $weightGrams * (float) $metalPricePerGram);
        $makingChargesInPaise = $this->toPaise($makingCharges);
        $shippingChargesInPaise = $this->toPaise($shippingCharges);
        $subtotalInPaise = $metalValueInPaise + $makingChargesInPaise + $shippingChargesInPaise;
        $taxTotalInPaise = 0;
        $taxLines = [];

        foreach ($taxes as $tax) {
            $rate = round((float) $tax['rate'], 3);
            $amountInPaise = (int) round($subtotalInPaise * $rate / 100);
            $taxTotalInPaise += $amountInPaise;
            $taxLines[] = [
                'name' => trim($tax['name']),
                'rate' => $rate,
                'amount' => $this->fromPaise($amountInPaise),
            ];
        }

        return [
            'metal_value' => $this->fromPaise($metalValueInPaise),
            'making_charges' => $this->fromPaise($makingChargesInPaise),
            'shipping_charges' => $this->fromPaise($shippingChargesInPaise),
            'subtotal' => $this->fromPaise($subtotalInPaise),
            'taxes' => $taxLines,
            'tax_total' => $this->fromPaise($taxTotalInPaise),
            'final_price' => $this->fromPaise($subtotalInPaise + $taxTotalInPaise),
        ];
    }

    /**
     * @return array{
     *     metal_value: float,
     *     making_charges: float,
     *     shipping_charges: float,
     *     subtotal: float,
     *     taxes: array<int, array{name: string, rate: float, amount: float}>,
     *     tax_total: float,
     *     final_price: float
     * }|null
     */
    public function forProduct(Product $product): ?array
    {
        if ($product->metal_price_per_gram === null || $product->weight_grams === null) {
            return null;
        }

        return $this->handle(
            $product->weight_grams,
            $product->metal_price_per_gram,
            $product->making_charges,
            $product->shipping_charges,
            $product->taxes ?? [],
        );
    }

    private function toPaise(string|int|float $amount): int
    {
        return (int) round((float) $amount * 100);
    }

    private function fromPaise(int $amount): float
    {
        return $amount / 100;
    }
}
