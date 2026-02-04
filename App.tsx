
import React, { useState, useEffect } from 'react';
import { CanonicalEntity, FinancialData, CalculatedRatios } from './types';
import { INITIAL_ENTITIES } from './constants';
import { calculateRatios } from './utils/calculations';
import { extractFinancialsFromPDF } from './services/geminiService';

const Header = ({ isGlobalLocked, onToggleLock }: { isGlobalLocked: boolean, onToggleLock: () => void }) => (
  <header className="border-b border-zinc-800 py-6 px-8 flex justify-between items-center bg-zinc-950 sticky top-0 z-50">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-emerald-500">FinAnalyzer <span className="text-zinc-400">Pro</span></h1>
      <p className="text-sm text-zinc-500">Global Lock & External Formula Logic</p>
    </div>
    <div className="flex items-center gap-4">
      <button 
        onClick={onToggleLock}
        className={`px-4 py-2 rounded-lg font-bold transition-all border ${isGlobalLocked ? 'bg-orange-900/20 border-orange-500 text-orange-500' : 'bg-emerald-900/20 border-emerald-500 text-emerald-500'}`}
      >
        {isGlobalLocked ? '🔒 SYSTEM LOCKED' : '🔓 SYSTEM UNLOCKED'}
      </button>
      <span className="text-xs px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-400 uppercase tracking-widest">v2.1 Production</span>
    </div>
  </header>
);

const App: React.FC = () => {
  const [data, setData] = useState<FinancialData>(() => {
    const init: FinancialData = {};
    INITIAL_ENTITIES.forEach(e => {
      init[e] = {
        value: "",
        extracted: ""
      };
    });
    return init;
  });

  const [isGlobalLocked, setIsGlobalLocked] = useState(false);
  const [ratios, setRatios] = useState<CalculatedRatios | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseValue = (val: any): number => {
    if (!val || val === "NOT_FOUND") return 0;
    const cleaned = String(val).replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const getComputedEbitda = (rev: any, opEx: any, dep: any, amort: any) => {
    return parseValue(rev) - parseValue(opEx) + parseValue(dep) + parseValue(amort);
  };

  const getComputedPbit = (ebitda: number, dep: any, amort: any) => {
    return ebitda - parseValue(dep) - parseValue(amort);
  };

  const handleValueChange = (entity: string, val: string) => {
    if (isGlobalLocked) return;
    setData(prev => {
      const newData = { ...prev, [entity]: { ...prev[entity], value: val } };
      
      // Auto-update EBITDA and PBIT if dependencies change
      if ([CanonicalEntity.Revenue, CanonicalEntity.OperatingExpenses, CanonicalEntity.Depreciation, CanonicalEntity.Amortization].includes(entity as any)) {
        const ebitdaVal = getComputedEbitda(
          newData[CanonicalEntity.Revenue].value,
          newData[CanonicalEntity.OperatingExpenses].value,
          newData[CanonicalEntity.Depreciation].value,
          newData[CanonicalEntity.Amortization].value
        );
        newData[CanonicalEntity.EBITDA].value = ebitdaVal.toFixed(2);
        
        const pbitVal = getComputedPbit(
          ebitdaVal,
          newData[CanonicalEntity.Depreciation].value,
          newData[CanonicalEntity.Amortization].value
        );
        newData[CanonicalEntity.PBIT].value = pbitVal.toFixed(2);
      }
      return newData;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGlobalLocked) {
      setError("System is locked. Unlock to allow extraction overwrite.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await extractFinancialsFromPDF(base64, file.type);
        
        setData(prev => {
          const newData = { ...prev };
          // Map extracted values
          Object.keys(result).forEach(key => {
            if (newData[key]) {
              newData[key].value = result[key];
              newData[key].extracted = result[key];
            }
          });

          // STRICT EXTERNAL CALCULATION OVERRIDE
          const ebitdaVal = getComputedEbitda(
            newData[CanonicalEntity.Revenue].value,
            newData[CanonicalEntity.OperatingExpenses].value,
            newData[CanonicalEntity.Depreciation].value,
            newData[CanonicalEntity.Amortization].value
          );
          newData[CanonicalEntity.EBITDA].value = ebitdaVal.toFixed(2);
          newData[CanonicalEntity.EBITDA].extracted = ebitdaVal.toFixed(2);
          
          const pbitVal = getComputedPbit(
            ebitdaVal,
            newData[CanonicalEntity.Depreciation].value,
            newData[CanonicalEntity.Amortization].value
          );
          newData[CanonicalEntity.PBIT].value = pbitVal.toFixed(2);
          newData[CanonicalEntity.PBIT].extracted = pbitVal.toFixed(2);

          return newData;
        });
        setIsExtracting(false);
      };
    } catch (err: any) {
      setError(err.message || "Extraction failed");
      setIsExtracting(false);
    }
  };

  const computeRatios = () => {
    const columnData: Record<string, any> = {};
    Object.keys(data).forEach(key => {
      columnData[key] = data[key].value;
    });
    const result = calculateRatios(columnData);
    setRatios(result);
  };

  const resetValues = () => {
    if (isGlobalLocked) return;
    setData(prev => {
      const reset = { ...prev };
      Object.keys(reset).forEach(key => {
        reset[key].value = reset[key].extracted;
      });
      return reset;
    });
  };

  const rows = [];
  for (let i = 0; i < INITIAL_ENTITIES.length; i += 5) {
    rows.push(INITIAL_ENTITIES.slice(i, i + 5));
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-zinc-300 pb-20">
      <Header isGlobalLocked={isGlobalLocked} onToggleLock={() => setIsGlobalLocked(!isGlobalLocked)} />
      
      <main className="flex-1 p-8 space-y-8">
        <section className="flex flex-wrap items-center gap-6 bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-zinc-500 uppercase">Input PDF</h3>
            <input 
              type="file" 
              accept=".pdf,image/*" 
              onChange={handleFileUpload}
              disabled={isGlobalLocked}
              className={`block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-zinc-950 hover:file:bg-emerald-500 cursor-pointer ${isGlobalLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="flex gap-4 ml-auto">
            <button 
              onClick={computeRatios}
              className="px-6 py-3 bg-blue-600 text-zinc-950 font-bold rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
            >
              🧮 Calculate Ratios
            </button>
            <button 
              onClick={resetValues}
              disabled={isGlobalLocked}
              className={`px-6 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-lg transition-colors border border-zinc-600 ${isGlobalLocked ? 'opacity-50' : 'hover:bg-zinc-700'}`}
            >
              🔄 Reset to Extracted
            </button>
          </div>
        </section>

        {isExtracting && (
          <div className="bg-emerald-900/10 border border-emerald-500/50 p-4 rounded-lg flex items-center justify-center gap-3">
             <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
             <p className="text-emerald-500 font-medium animate-pulse">Gemini analyzing document... Time remaining: ~15s</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/10 border border-red-500/50 p-4 rounded-lg">
             <p className="text-red-500 text-sm font-bold">ERROR: {error}</p>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-600 uppercase tracking-widest px-1">Financial Entity Grid (Row-wise)</h2>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            {rows.map((rowEntities, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-5 gap-4">
                {rowEntities.map((entity) => {
                  const isComputed = entity === CanonicalEntity.EBITDA || entity === CanonicalEntity.PBIT;
                  return (
                    <div key={entity} className={`flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-950/50 border ${isComputed ? 'border-blue-900/30' : 'border-zinc-900'} hover:border-zinc-700 transition-all relative`}>
                      <label className="text-[10px] font-bold text-zinc-500 truncate uppercase" title={entity}>
                        {entity} {isComputed && <span className="text-blue-500 ml-1">(COMPUTED)</span>}
                      </label>
                      <input
                        type="text"
                        value={data[entity].value}
                        disabled={isGlobalLocked}
                        onChange={(e) => handleValueChange(entity, e.target.value)}
                        placeholder="N/A"
                        className={`w-full bg-zinc-900 border ${isGlobalLocked ? 'border-zinc-800 text-zinc-500' : isComputed ? 'border-blue-800 text-blue-400' : 'border-zinc-800 text-emerald-400 focus:border-emerald-500 focus:bg-black'} rounded px-2 py-1.5 text-sm outline-none transition-all font-mono`}
                      />
                    </div>
                  );
                })}
                {rowEntities.length < 5 && Array(5 - rowEntities.length).fill(0).map((_, i) => (
                  <div key={`empty-${i}`} className="invisible" />
                ))}
              </div>
            ))}
          </div>
        </section>

        {ratios && (
          <section className="space-y-6 pt-6">
            <h2 className="text-xl font-bold text-zinc-400 px-1 border-l-4 border-blue-600 pl-4">Computed Financial Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(ratios).map(([key, val]) => (
                <div key={key} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all shadow-inner">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase text-center tracking-tight leading-none h-6 flex items-center">{key}</span>
                  <span className="text-lg font-mono font-bold text-blue-400">{val}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-zinc-950 border-t border-zinc-800 py-4 px-8 flex justify-between text-[10px] text-zinc-600">
        <div>&copy; {new Date().getFullYear()} FinAnalyzer Pro Financial Systems</div>
        <div className="flex gap-4 uppercase tracking-tighter">
          <span>AI Engine: Gemini 3 Flash Preview</span>
          <span className="text-emerald-500">Formulas: EBITDA (R-OpEx+D+A) | PBIT (E-D-A)</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
