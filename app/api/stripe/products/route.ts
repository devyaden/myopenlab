import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    usd: "$",
    gbp: "£",
    eur: "€",
    jpy: "¥",
    inr: "₹",
    cad: "C$",
    aud: "A$",
  };
  return symbols[currency.toLowerCase()] || currency.toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price", "data.default_price.custom_unit_amount"],
    });

    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
    });

    const productsWithPrices = products.data.map((product) => {
      const productPrices = prices.data.filter(
        (price) =>
          typeof price.product === "string"
            ? price.product === product.id
            : price.product.id === product.id
      );

      const defaultPrice =
        typeof product.default_price === "string"
          ? prices.data.find((p) => p.id === product.default_price)
          : product.default_price;

      const customUnitLabel = defaultPrice?.unit_amount_decimal ? null : (defaultPrice?.custom_unit_amount?.preset || null);

      const features: string[] = [];
      const metadata = product.metadata || {};

      const excludedKeys = ['plan_type', 'badge'];
      Object.entries(metadata).forEach(([key, value]) => {
        if (!excludedKeys.includes(key) && value && (customUnitLabel === null || value !== String(customUnitLabel))) {
          features.push(value);
        }
      });

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: {
          ...product.metadata,
          features: features, // Add features array to metadata
        },
        prices: productPrices.map((price) => ({
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          intervalCount: price.recurring?.interval_count,
          type: price.type,
          metadata: price.metadata,
        })),
        defaultPrice: defaultPrice
          ? {
              id: defaultPrice.id,
              amount: defaultPrice.unit_amount,
              currency: defaultPrice.currency,
              currencySymbol: getCurrencySymbol(defaultPrice.currency),
              interval: defaultPrice.recurring?.interval,
              intervalCount: defaultPrice.recurring?.interval_count,
              customUnitLabel: customUnitLabel,
            }
          : null,
      };
    });

    const sortedProducts = productsWithPrices.sort((a, b) => {
      if ((a.metadata as any)?.plan_type === "free") return -1;
      if ((b.metadata as any)?.plan_type === "free") return 1;

      const aPrice = a.defaultPrice?.amount || 0;
      const bPrice = b.defaultPrice?.amount || 0;
      return aPrice - bPrice;
    });

    return NextResponse.json({
      products: sortedProducts,
    });
  } catch (error: any) {
    console.error("Error fetching Stripe products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
