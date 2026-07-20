import { describe, expect, it } from "vitest";
import { assetInputSchema, incomeExpenseInputSchema } from "@/lib/validation/schemas";

describe("validation schemas", () => {
  it("validerer en manuell beholdning", () => {
    const result = assetInputSchema.safeParse({
      name: "Ethereum",
      symbol: "ETH",
      category: "krypto",
      quantity: "2",
      purchasePrice: "22000",
      currentPrice: "34000",
      currency: "NOK",
      lastUpdated: "2026-07-20",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(2);
    }
  });

  it("avviser negative inntekts- og utgiftsposter", () => {
    const result = incomeExpenseInputSchema.safeParse({
      amount: -1,
      date: "2026-07-20",
      category: "Mat",
      description: "Test",
      type: "expense",
      cadence: "variable",
      recurrence: "one-off",
    });

    expect(result.success).toBe(false);
  });
});
