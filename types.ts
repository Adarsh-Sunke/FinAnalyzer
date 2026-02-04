
export enum CanonicalEntity {
  Revenue = "Revenue",
  COGS = "Cost of Goods Sold",
  EBITDA = "EBITDA",
  OperatingExpenses = "Operating Expenses",
  Depreciation = "Depreciation",
  Amortization = "Amortization",
  PAT = "Profit After Tax",
  BegEquity = "Beginning Share Holders Equity",
  EndEquity = "Ending Share Holders Equity",
  LTDebt = "Long Term Debt",
  PBIT = "PBIT",
  BegAssets = "Beginning Assets",
  EndAssets = "Ending Assets",
  CurrentAssets = "Current Assets",
  CurrentLiabilities = "Current Liabilities",
  Inventories = "Inventories",
  CashEquivalents = "Cash & Cash Equivalents",
  BegFixedAssets = "Beginning Fixed Assets",
  EndFixedAssets = "Ending Fixed Assets",
  BegCurrentAssets = "Beginning Current Assets",
  BegCurrentLiabs = "Beginning Current Liabilities",
  EndCurrentAssets = "Ending Current Assets",
  EndCurrentLiabs = "Ending Current Liabilities",
  InterestExpense = "Interest Expense",
  STDebt = "Short Term Debt",
  TotalAssets = "Total Assets",
  SharePrice = "Share Price",
  OutstandingShares = "Number of Outstanding Shares"
}

export type EntityValue = string | number | "NOT_FOUND";

export interface FinancialData {
  [key: string]: {
    value: EntityValue;
    extracted: EntityValue;
  };
}

export interface CalculatedRatios {
  [key: string]: string;
}

export interface ExtractionResponse {
  entities: Record<string, string | number>;
  status: "SUCCESS" | "PARTIAL" | "ERROR";
}
