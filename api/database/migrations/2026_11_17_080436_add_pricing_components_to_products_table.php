<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('metal_price_per_gram', 12, 2)->nullable()->after('weight_grams');
            $table->decimal('making_charges', 12, 2)->default(0)->after('metal_price_per_gram');
            $table->decimal('shipping_charges', 12, 2)->default(0)->after('making_charges');
            $table->json('taxes')->nullable()->after('shipping_charges');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'metal_price_per_gram',
                'making_charges',
                'shipping_charges',
                'taxes',
            ]);
        });
    }
};
