import type { TransactionCategory, TransactionType } from "@codea-srm/db";

export interface CategorizationInput {
  type: TransactionType;
  description?: string;
  supplierName?: string;
}

interface KeywordRule {
  category: TransactionCategory;
  keywords: string[];
}

// FIN-2 automatic categorization: simple keyword matching against
// description/supplier name. Ordered so more specific rules win over
// generic ones when multiple keywords match.
const EXPENSE_RULES: KeywordRule[] = [
  {
    category: "SOFTWARE_SUBSCRIPTION",
    keywords: ["aws", "google", "adobe", "microsoft", "saas", "subscription", "abonament", "software"],
  },
  { category: "TRAVEL", keywords: ["hotel", "хотел", "flight", "билет", "taxi", "такси", "travel"] },
  { category: "UTILITIES", keywords: ["electricity", "ток", "water", "вода", "internet", "utility"] },
  {
    category: "PROFESSIONAL_SERVICES",
    keywords: ["consulting", "консултант", "lawyer", "адвокат", "accountant", "счетоводител"],
  },
  { category: "SUPPLIES", keywords: ["office", "офис", "supplies", "материали", "stationery"] },
];

function normalize(value: string | undefined): string {
  return (value ?? "").toLowerCase();
}

export function suggestCategory(input: CategorizationInput): TransactionCategory {
  if (input.type === "INCOME") {
    return "CLIENT_INCOME";
  }

  const haystack = `${normalize(input.description)} ${normalize(input.supplierName)}`;
  for (const rule of EXPENSE_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.category;
    }
  }

  return "OTHER_EXPENSE";
}
