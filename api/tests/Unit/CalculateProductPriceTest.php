<?php

namespace Tests\Unit;

use App\Actions\CalculateProductPrice;
use PHPUnit\Framework\TestCase;

class CalculateProductPriceTest extends TestCase
{
    public function test_calculates_each_tax_line_to_two_decimal_places(): void
    {
        $breakdown = (new CalculateProductPrice)->handle(
            '1.234',
            '1234.56',
            '100.10',
            '49.99',
            [
                ['name' => 'CGST', 'rate' => '1.5'],
                ['name' => 'Luxury tax', 'rate' => '2.5'],
            ],
        );

        $this->assertSame([
            'metal_value' => 1523.45,
            'making_charges' => 100.1,
            'shipping_charges' => 49.99,
            'subtotal' => 1673.54,
            'taxes' => [
                ['name' => 'CGST', 'rate' => 1.5, 'amount' => 25.1],
                ['name' => 'Luxury tax', 'rate' => 2.5, 'amount' => 41.84],
            ],
            'tax_total' => 66.94,
            'final_price' => 1740.48,
        ], $breakdown);
    }
}
