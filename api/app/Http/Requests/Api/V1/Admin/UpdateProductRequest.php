<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($product)],
            'sku' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($product)],
            'short_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'metal' => ['sometimes', 'nullable', 'string', 'max:100'],
            'purity' => ['sometimes', 'nullable', 'string', 'max:50'],
            'gemstone' => ['sometimes', 'nullable', 'string', 'max:100'],
            'weight_grams' => ['sometimes', 'nullable', 'numeric', 'gt:0'],
            'metal_price_per_gram' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'making_charges' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'shipping_charges' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'taxes' => ['sometimes', 'nullable', 'array', 'max:10'],
            'taxes.*.name' => ['required', 'string', 'max:100', 'distinct:ignore_case'],
            'taxes.*.rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'sale_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'compare_at_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
            'image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'extensions:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'is_featured' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $aliases = [];

        if (! $this->has('metal')) {
            if ($this->has('metal_type')) {
                $aliases['metal'] = $this->input('metal_type');
            } elseif ($this->has('material')) {
                $aliases['metal'] = $this->input('material');
            }
        }

        if (! $this->has('weight_grams') && $this->has('weight')) {
            $aliases['weight_grams'] = $this->input('weight');
        }

        $this->merge($aliases);
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny([
                    'metal',
                    'weight_grams',
                    'metal_price_per_gram',
                    'making_charges',
                    'shipping_charges',
                    'taxes',
                    'price',
                    'sale_price',
                ])) {
                    return;
                }

                $product = $this->route('product');
                $metalPricePerGram = $this->input('metal_price_per_gram', $product->metal_price_per_gram);

                if ($metalPricePerGram !== null) {
                    $componentValues = [
                        'metal' => $this->input('metal', $product->metal),
                        'weight_grams' => $this->input('weight_grams', $product->weight_grams),
                        'making_charges' => $this->input('making_charges', $product->making_charges),
                        'shipping_charges' => $this->input('shipping_charges', $product->shipping_charges),
                        'taxes' => $this->input('taxes', $product->taxes),
                    ];

                    foreach ($componentValues as $field => $value) {
                        if ($value === null || ($field === 'metal' && trim((string) $value) === '')) {
                            $validator->errors()->add(
                                $field,
                                "The {$field} field is required when metal price per gram is present.",
                            );
                        }
                    }

                    return;
                }

                $price = (float) $this->input('price', $product->price);
                $salePrice = $this->input('sale_price', $product->sale_price);

                if ($salePrice !== null && (float) $salePrice > $price) {
                    $validator->errors()->add('sale_price', 'The sale price must be less than or equal to the price.');
                }
            },
        ];
    }
}
