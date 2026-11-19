<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class StoreProductRequest extends FormRequest
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
        return [
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:products,slug'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:10000'],
            'metal' => ['nullable', 'string', 'max:100', 'required_with:metal_price_per_gram'],
            'purity' => ['nullable', 'string', 'max:50'],
            'gemstone' => ['nullable', 'string', 'max:100'],
            'weight_grams' => ['nullable', 'numeric', 'gt:0', 'required_with:metal_price_per_gram'],
            'metal_price_per_gram' => [
                'nullable',
                'numeric',
                'min:0',
                'required_with:making_charges,shipping_charges,taxes',
            ],
            'making_charges' => ['nullable', 'numeric', 'min:0', 'required_with:metal_price_per_gram'],
            'shipping_charges' => ['nullable', 'numeric', 'min:0', 'required_with:metal_price_per_gram'],
            'taxes' => ['nullable', 'array', 'max:10', 'required_with:metal_price_per_gram'],
            'taxes.*.name' => ['required', 'string', 'max:100', 'distinct:ignore_case'],
            'taxes.*.rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'price' => ['nullable', 'numeric', 'min:0', 'required_without:metal_price_per_gram'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'image' => [
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

        if (! $this->filled('slug') && $this->filled('name')) {
            $aliases['slug'] = Str::slug($this->string('name')->toString());
        }

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
                if (
                    $this->input('metal_price_per_gram') !== null
                    || $validator->errors()->hasAny(['price', 'sale_price'])
                ) {
                    return;
                }

                $salePrice = $this->input('sale_price');

                if ($salePrice !== null && (float) $salePrice > (float) $this->input('price')) {
                    $validator->errors()->add('sale_price', 'The sale price must be less than or equal to the price.');
                }
            },
        ];
    }
}
