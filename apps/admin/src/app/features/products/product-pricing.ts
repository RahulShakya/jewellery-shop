import type { ProductPriceBreakdown } from '@carat-line/models';

export interface ProductPricingInput {
  weight_grams: number | string;
  metal_price_per_gram: number | string;
  making_charges: number | string;
  shipping_charges: number | string;
  taxes: ReadonlyArray<{ name: string; rate: number | string }>;
}

export interface ProductPricingFormValue extends ProductPricingInput {
  metal_type: string;
}

export function calculateProductPricing(input: ProductPricingInput): ProductPriceBreakdown {
  const metalValue = roundCurrency(
    numberValue(input.weight_grams) * numberValue(input.metal_price_per_gram),
  );
  const makingCharges = roundCurrency(numberValue(input.making_charges));
  const shippingCharges = roundCurrency(numberValue(input.shipping_charges));
  const subtotal = roundCurrency(metalValue + makingCharges + shippingCharges);
  const taxes = input.taxes.map((tax) => ({
    name: tax.name.trim(),
    rate: numberValue(tax.rate),
    amount: roundCurrency((subtotal * numberValue(tax.rate)) / 100),
  }));
  const taxTotal = roundCurrency(taxes.reduce((total, tax) => total + (tax.amount ?? 0), 0));

  return {
    metal_value: metalValue,
    making_charges: makingCharges,
    shipping_charges: shippingCharges,
    subtotal,
    taxes,
    tax_total: taxTotal,
    final_price: roundCurrency(subtotal + taxTotal),
  };
}

export function buildProductPricingPayload(input: ProductPricingFormValue) {
  return {
    metal_type: input.metal_type.trim(),
    weight_grams: numberValue(input.weight_grams),
    metal_price_per_gram: numberValue(input.metal_price_per_gram),
    making_charges: roundCurrency(numberValue(input.making_charges)),
    shipping_charges: roundCurrency(numberValue(input.shipping_charges)),
    taxes: input.taxes.map((tax) => ({
      name: tax.name.trim(),
      rate: numberValue(tax.rate),
    })),
  };
}

function numberValue(value: number | string): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
