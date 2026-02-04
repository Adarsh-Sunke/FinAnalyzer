
import { CanonicalEntity } from './types';

export const ENTITY_ALIASES: Record<string, string[]> = {
  [CanonicalEntity.Revenue]: ["Revenue from Operations", "Income from Operations", "Operating Revenue", "Net Sales", "Sales", "Turnover"],
  [CanonicalEntity.COGS]: ["Cost of Sales", "Direct Costs", "Cost of Revenue", "Purchase of Stock-in-Trade"],
  [CanonicalEntity.EBITDA]: ["OPBDIT", "Operating EBITDA", "Cash Operating Profit"],
  [CanonicalEntity.OperatingExpenses]: ["Operating Costs", "Total Operating Expenses", "OpEx"],
  [CanonicalEntity.Depreciation]: ["Depreciation and Depletion"],
  [CanonicalEntity.Amortization]: ["Amortization of Intangible Assets"],
  [CanonicalEntity.PBIT]: ["EBIT", "Operating Profit"],
  [CanonicalEntity.BegEquity]: ["Net Worth", "Shareholders’ Funds", "Owners’ Equity"],
  [CanonicalEntity.LTDebt]: ["Non-Current Borrowings", "Term Loans"],
  [CanonicalEntity.STDebt]: ["Short-Term Borrowings", "Current Borrowings"],
  [CanonicalEntity.BegAssets]: ["Property Plant & Equipment", "PPE", "Net Block", "Fixed Assets"]
};

export const REJECTED_ALIASES = ["Total Revenue", "Total Income", "Other Income"];

export const INITIAL_ENTITIES = Object.values(CanonicalEntity);
