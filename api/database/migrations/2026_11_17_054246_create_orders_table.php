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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->string('customer_email')->nullable();
            $table->text('shipping_address');
            $table->string('city');
            $table->string('state')->nullable();
            $table->string('pincode', 10);
            $table->decimal('subtotal', 12, 2);
            $table->decimal('gst_amount', 12, 2);
            $table->decimal('total_amount', 12, 2);
            $table->enum('payment_method', ['cod'])->default('cod');
            $table->enum('payment_status', ['pending_cod', 'collected', 'failed'])->default('pending_cod');
            $table->enum('order_status', ['placed', 'confirmed', 'dispatched', 'delivered', 'cancelled'])->default('placed');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['order_status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
