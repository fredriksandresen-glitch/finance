import { z } from "zod";

export const currencySchema = z.enum(["NOK", "USD", "EUR", "GBP", "SEK", "DKK"]);
export const assetCategorySchema = z.enum([
  "aksjer",
  "krypto",
  "fond",
  "kontanter",
  "eiendom",
  "andre",
]);

export const assetInputSchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  symbol: z.string().min(1, "Symbol er påkrevd"),
  category: assetCategorySchema,
  quantity: z.coerce.number().nonnegative(),
  purchasePrice: z.coerce.number().nonnegative(),
  currentPrice: z.coerce.number().nonnegative(),
  currency: currencySchema.default("NOK"),
  lastUpdated: z.string().min(1),
});

export const incomeExpenseInputSchema = z.object({
  amount: z.coerce.number().positive("Beløp må være større enn 0"),
  date: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["income", "expense"]),
  cadence: z.enum(["fixed", "variable"]),
  recurrence: z.enum(["recurring", "one-off"]),
});

export const settingsSchema = z.object({
  defaultCurrency: currencySchema.default("NOK"),
  theme: z.enum(["system", "light", "dark"]).default("system"),
  icpCanisterId: z.string().min(1),
  internetIdentityEnabled: z.boolean().default(false),
});

export type AssetInput = z.infer<typeof assetInputSchema>;
export type IncomeExpenseInput = z.infer<typeof incomeExpenseInputSchema>;
