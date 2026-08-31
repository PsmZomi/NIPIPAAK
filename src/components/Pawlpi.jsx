import { useMemo } from "react";
import { usePawlpiStore } from "../hooks/usePawlpiStore";
import PawlpiSelect from "./PawlpiSelect";
import {
  PAWLPI_COLLECTION_DOC,
  PAWLPI_LOAN_DOC,
} from "../utils/pawlpiSession";
import {
  TABLE_CAPITAL,
  formatRupee,
  monthsForCollection,
  monthsForLoan,
  parseAmount,
} from "../utils/pawlpiHelpers";

function KpiCard({ label, value }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-muted mb-1 leading-tight">
        {label}
      </p>
      <p className="text-lg sm:text-2xl font-bold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}

export default function Pawlpi({
  selectedYear,
  onYearChange,
  years = [],
}) {
  const collection = usePawlpiStore(PAWLPI_COLLECTION_DOC, monthsForCollection, {
    canEdit: false,
    externalYear: selectedYear,
  });
  const loan = usePawlpiStore(PAWLPI_LOAN_DOC, monthsForLoan, {
    canEdit: false,
    externalYear: selectedYear,
  });

  const collectionMonths = useMemo(
    () => monthsForCollection(selectedYear),
    [selectedYear],
  );
  const loanMonths = useMemo(() => monthsForLoan(), []);

  const collectionYearTotal = useMemo(() => {
    const rows = collection.store.byYear[selectedYear] || [];
    return collectionMonths.reduce(
      (sum, m) =>
        sum + rows.reduce((s, row) => s + parseAmount(row.values?.[m]), 0),
      0,
    );
  }, [collection.store.byYear, collectionMonths, selectedYear]);

  const capitalYearTotal = useMemo(() => {
    const rows = collection.store.byYear[selectedYear] || [];
    return rows.reduce(
      (sum, row) => sum + parseAmount(row.values?.[TABLE_CAPITAL]),
      0,
    );
  }, [collection.store.byYear, selectedYear]);

  const loanYearTotal = useMemo(() => {
    const rows = loan.store.byYear[selectedYear] || [];
    return loanMonths.reduce(
      (sum, m) =>
        sum + rows.reduce((s, row) => s + parseAmount(row.values?.[m]), 0),
      0,
    );
  }, [loan.store.byYear, loanMonths, selectedYear]);

  const ready = collection.ready && loan.ready;

  return (
    <div className="w-full mb-2 lg:mb-4 lg:space-y-2">
      <header className="relative z-10 flex items-center justify-center py-2 lg:py-10 mb-2">
        <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-ink text-center">
          PAWLPI SUM
        </h1>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 shrink-0 w-[4.5rem] sm:w-[5rem]">
          <PawlpiSelect
            value={selectedYear}
            onChange={(y) => onYearChange?.(Number(y))}
            ariaLabel="Year"
            options={years.map((y) => ({ value: y, label: String(y) }))}
          />
        </div>
      </header>

      {!ready ? (
        <p className="text-center font-mono text-[10px] text-muted py-10">
          Loading…
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-6">
           <KpiCard
            label="Capital"
            value={formatRupee(capitalYearTotal)}
          />
          <KpiCard
            label="Collection"
            value={formatRupee(collectionYearTotal)}
          />
          <KpiCard
            label="Loan Interest"
            value={formatRupee(loanYearTotal)}
          />
         
        </div>
      )}
    </div>
  );
}
