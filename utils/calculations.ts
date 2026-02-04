
import { CanonicalEntity } from '../types';

const parseNum = (val: any): number => {
  if (val === "NOT_FOUND" || val === null || val === undefined || val === "") return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export function calculateRatios(data: Record<string, any>, taxRate: number = 0.25) {
  const r = (key: CanonicalEntity) => parseNum(data[key]);

  const revenue = r(CanonicalEntity.Revenue);
  const cogs = r(CanonicalEntity.COGS);
  const opEx = r(CanonicalEntity.OperatingExpenses);
  const dep = r(CanonicalEntity.Depreciation);
  const amort = r(CanonicalEntity.Amortization);
  
  // STRICT FORMULA 1: EBITDA = Operating Revenue − Operating Expenses + Depreciation + Amortization
  const ebitda = revenue - opEx + dep + amort;
  
  // STRICT FORMULA 2: PBIT (EBIT) = EBITDA − Depreciation − Amortization
  const ebit = ebitda - dep - amort;
  const pbit = ebit;
  
  const pat = r(CanonicalEntity.PAT);
  const interest = r(CanonicalEntity.InterestExpense);
  
  const totalDebt = r(CanonicalEntity.LTDebt) + r(CanonicalEntity.STDebt);
  const equity = r(CanonicalEntity.EndEquity);
  const assets = r(CanonicalEntity.TotalAssets);

  // Formulas
  const grossProfit = revenue - cogs;
  const grossProfitMargin = revenue !== 0 ? (grossProfit / revenue) * 100 : 0;
  const ebitdaMargin = revenue !== 0 ? (ebitda / revenue) * 100 : 0;
  const patMargin = revenue !== 0 ? (pat / revenue) * 100 : 0;

  const avgEquity = (r(CanonicalEntity.BegEquity) + r(CanonicalEntity.EndEquity)) / 2;
  const roe = avgEquity !== 0 ? (pat / avgEquity) * 100 : 0;

  const capitalEmployed = r(CanonicalEntity.EndEquity) + r(CanonicalEntity.LTDebt);
  const roce = capitalEmployed !== 0 ? (pbit / capitalEmployed) * 100 : 0;

  const avgAssets = (r(CanonicalEntity.BegAssets) + r(CanonicalEntity.EndAssets)) / 2;
  const roa = avgAssets !== 0 ? ((pat + interest * (1 - taxRate)) / avgAssets) * 100 : 0;

  const currentRatio = r(CanonicalEntity.CurrentLiabilities) !== 0 ? r(CanonicalEntity.CurrentAssets) / r(CanonicalEntity.CurrentLiabilities) : 0;
  const quickRatio = r(CanonicalEntity.CurrentLiabilities) !== 0 ? (r(CanonicalEntity.CurrentAssets) - r(CanonicalEntity.Inventories)) / r(CanonicalEntity.CurrentLiabilities) : 0;
  const cashRatio = r(CanonicalEntity.CurrentLiabilities) !== 0 ? r(CanonicalEntity.CashEquivalents) / r(CanonicalEntity.CurrentLiabilities) : 0;

  const avgFixedAssets = (r(CanonicalEntity.BegFixedAssets) + r(CanonicalEntity.EndFixedAssets)) / 2;
  const faTurnover = avgFixedAssets !== 0 ? revenue / avgFixedAssets : 0;

  const begWc = r(CanonicalEntity.BegCurrentAssets) - r(CanonicalEntity.BegCurrentLiabs);
  const endWc = r(CanonicalEntity.EndCurrentAssets) - r(CanonicalEntity.EndCurrentLiabs);
  const avgWc = (begWc + endWc) / 2;
  const wcTurnover = avgWc !== 0 ? revenue / avgWc : 0;

  const totalAssetTurnover = r(CanonicalEntity.EndAssets) !== 0 ? revenue / r(CanonicalEntity.EndAssets) : 0;
  const interestCoverage = interest !== 0 ? pbit / interest : 0;

  const debtEquity = equity !== 0 ? totalDebt / equity : 0;
  const debtAsset = assets !== 0 ? totalDebt / assets : 0;

  const eps = r(CanonicalEntity.OutstandingShares) !== 0 ? pat / r(CanonicalEntity.OutstandingShares) : 0;
  const pe = eps !== 0 ? r(CanonicalEntity.SharePrice) / eps : 0;
  const pb = (equity !== 0 && r(CanonicalEntity.OutstandingShares) !== 0) ? r(CanonicalEntity.SharePrice) / (equity / r(CanonicalEntity.OutstandingShares)) : 0;
  const mktCap = r(CanonicalEntity.SharePrice) * r(CanonicalEntity.OutstandingShares);
  const evEbitda = ebitda !== 0 ? (mktCap + totalDebt - r(CanonicalEntity.CashEquivalents)) / ebitda : 0;

  return {
    "Gross Profit": grossProfit.toFixed(2),
    "GP Margin (%)": grossProfitMargin.toFixed(2),
    "EBITDA": ebitda.toFixed(2),
    "EBITDA Margin (%)": ebitdaMargin.toFixed(2),
    "PBIT (EBIT)": pbit.toFixed(2),
    "PAT Margin (%)": patMargin.toFixed(2),
    "ROE (%)": roe.toFixed(2),
    "ROCE (%)": roce.toFixed(2),
    "ROA (%)": roa.toFixed(2),
    "Current Ratio": currentRatio.toFixed(2),
    "Quick Ratio": quickRatio.toFixed(2),
    "Cash Ratio": cashRatio.toFixed(2),
    "FA Turnover": faTurnover.toFixed(2),
    "WC Turnover": wcTurnover.toFixed(2),
    "Total Asset Turnover": totalAssetTurnover.toFixed(2),
    "Interest Coverage": interestCoverage.toFixed(2),
    "Debt-Equity": debtEquity.toFixed(2),
    "Debt-Asset": debtAsset.toFixed(2),
    "P/E Ratio": pe.toFixed(2),
    "P/B Ratio": pb.toFixed(2),
    "EV/EBITDA": evEbitda.toFixed(2)
  };
}
