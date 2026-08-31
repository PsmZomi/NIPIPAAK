import { useRef, useState } from "react";
import { usePawlpiStore } from "../hooks/usePawlpiStore";
import PawlpiSelect from "./PawlpiSelect";
import {
  PAWLPI_COLLECTION_DOC,
  PAWLPI_LOAN_DOC,
} from "../utils/pawlpiSession";
import {
  TABLE_CAPITAL,
  collectionColumns,
  formatRupee,
  formatTotal,
  formatCellAmount,
  parseAmount,
  loanColumns,
} from "../utils/pawlpiHelpers";

export {
  collectionColumns,
  loanColumns,
  monthsForCollection,
  monthsForLoan,
} from "../utils/pawlpiHelpers";

/** Shared widths so header labels line up with body cells */
const NAME_COL = "shrink-0 w-[6.5rem] sm:w-[11rem]";
const CAPITAL_COL = "shrink-0 w-11 sm:w-[4.5rem]";
const MONTH_COL = "w-11 sm:w-[4.5rem] shrink-0";
const TOTAL_COL = "w-12 sm:w-[4.5rem] shrink-0";
const FIXED_SHADOW = "shadow-[6px_0_12px_-8px_rgba(0,0,0,0.18)]";
const SCROLL_X_CLASS =
  "min-w-0 flex-1 overflow-x-auto overscroll-x-contain touch-pan-x scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const SCROLL_X_STYLE = {
  WebkitOverflowScrolling: "touch",
  scrollBehavior: "smooth",
};

const STICKY_YEAR_LABEL_CLASS =
  "block w-full text-center text-sm font-semibold text-ink tabular-nums py-2";

function YearTableSection({
  caption,
  storeDocId,
  getMonths,
  canEdit,
  hideCaption = false,
  unifiedSticky = false,
  stickySection = null,
  stickyRoleLabel = null,
  selectedYear,
  onYearChange,
  years,
  hideYearPicker = false,
  formatColumnLabel = (col) => col,
  excludeCapitalFromTotal = false,
  showInterestTotal = false,
}) {
  const {
    ready,
    store,
    saveError,
    year,
    months,
    rows,
    rowTotals,
    monthTotals,
    yearTotal,
    setYear,
    addYear,
    updateRow,
    updateCell,
    addRow,
  } = usePawlpiStore(storeDocId, getMonths, {
    canEdit,
    externalYear: selectedYear,
    excludeCapitalFromTotal,
  });

  const availableYears = years || store.years;
  const hasFixedCapital = months.includes(TABLE_CAPITAL);
  const scrollColumns = hasFixedCapital
    ? months.filter((m) => m !== TABLE_CAPITAL)
    : months;

  function handleYearChange(nextYear) {
    const y = Number(nextYear);
    setYear(y);
    onYearChange?.(y);
  }

  const inputClass = canEdit
    ? "border-0 bg-transparent outline-none focus:ring-1 focus:ring-green-400/40 rounded-none"
    : "border-0 bg-transparent cursor-default text-ink outline-none";

  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const syncing = useRef(false);

  function syncScroll(from, to) {
    if (syncing.current || !from || !to) return;
    syncing.current = true;
    to.scrollLeft = from.scrollLeft;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }

  const yearSelect = hideYearPicker ? (
    <span
      className={
        unifiedSticky
          ? STICKY_YEAR_LABEL_CLASS
          : "block w-full text-center text-sm font-semibold text-ink tabular-nums py-2"
      }
    >
      {year}
    </span>
  ) : (
    <div className="flex items-center gap-1 min-w-0">
      <PawlpiSelect
        className="flex-1 min-w-0"
        value={year}
        onChange={handleYearChange}
        ariaLabel="Year"
        options={availableYears.map((y) => ({
          value: y,
          label: String(y),
        }))}
      />
      {canEdit ? (
        <button
          type="button"
          onClick={addYear}
          className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border-0 bg-transparent text-lg font-bold text-ink"
          aria-label="Add next year"
          title="Add next year"
        >
          +
        </button>
      ) : null}
    </div>
  );

  const yearControlsDesktop = (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {!hideCaption ? (
        <p className="w-full text-center font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted mb-1">
          {caption}
        </p>
      ) : null}
      {!hideYearPicker ? (
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
          Year
          {yearSelect}
        </label>
      ) : null}
    </div>
  );

  const monthsAndTotalHeader = (
    <div className="min-w-max h-9 sm:h-12 flex items-stretch">
      {scrollColumns.map((m) => (
        <div
          key={m}
          className={`${MONTH_COL} flex items-center justify-center text-[9px] sm:text-xs font-bold uppercase tracking-widest text-muted`}
        >
          {formatColumnLabel(m)}
        </div>
      ))}
      <div
        className={`${TOTAL_COL} flex items-center justify-center text-[9px] sm:text-xs font-bold uppercase tracking-widest text-ink`}
      >
        Total
      </div>
    </div>
  );

  const nameFixedClass = hasFixedCapital
    ? NAME_COL
    : `${NAME_COL} ${FIXED_SHADOW}`;

  const fixedCapitalHeader = hasFixedCapital ? (
    <div
      className={`${CAPITAL_COL} flex items-center justify-center h-9 sm:h-12 text-[9px] sm:text-xs font-bold uppercase tracking-widest text-muted ${FIXED_SHADOW} z-20`}
    >
      {formatColumnLabel(TABLE_CAPITAL)}
    </div>
  ) : null;

  const fixedCapitalBody = hasFixedCapital ? (
    <div className={`${CAPITAL_COL} z-10 ${FIXED_SHADOW}`}>
      {rows.map((row) => (
        <div
          key={row.id}
          className="h-9 sm:h-12 flex items-center px-0.5 sm:px-1"
        >
          <input
            type="text"
            value={formatCellAmount(row.values?.[TABLE_CAPITAL])}
            readOnly={!canEdit}
            onChange={(e) => {
              const next = e.target.value.trim();
              updateCell(
                row.id,
                TABLE_CAPITAL,
                next === "" ? "" : String(parseAmount(next)),
              );
            }}
            className={`w-full h-full px-0 sm:px-1 text-xs sm:text-sm text-center outline-none ${inputClass}`}
          />
        </div>
      ))}
      <div className="h-9 sm:h-12 flex items-center justify-center px-0.5">
        <span className="text-[10px] sm:text-xs font-bold text-ink tabular-nums">
          {formatTotal(monthTotals[TABLE_CAPITAL])}
        </span>
      </div>
    </div>
  ) : null;

  const nameMonthHeader = ready ? (
    <div className="flex -mx-1 sm:mx-0">
      <div
        className={`${nameFixedClass} flex items-center justify-center px-0.5 sm:px-3 h-9 sm:h-12 text-[9px] sm:text-xs font-bold uppercase tracking-widest text-muted z-30`}
      >
        Name
      </div>
      {fixedCapitalHeader}
      <div
        ref={headerScrollRef}
        onScroll={() =>
          syncScroll(headerScrollRef.current, bodyScrollRef.current)
        }
        className={SCROLL_X_CLASS}
        style={SCROLL_X_STYLE}
      >
        {monthsAndTotalHeader}
      </div>
    </div>
  ) : null;

  const interestSummary = showInterestTotal && ready ? (
    <p className="text-center py-1.5 sm:py-2 text-sm sm:text-[10px] font-bold uppercase tracking-widest text-muted">
      Total Interest{" "}
      <span className="text-muted tabular-nums text-sm sm:text-base font-bold tracking-normal normal-case">
        {formatRupee(yearTotal)}
      </span>

    </p>
  ) : null;

  return (
    <section className="w-full">
      {unifiedSticky ? (
        <div className="sticky top-[100px] sm:top-[104px] lg:top-[112px] z-40 bg-paper backdrop-blur-md -mx-1 px-1 border-b border-zinc-200 shadow-sm">
          {stickyRoleLabel ? (
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted pt-2 pb-1">
              {stickyRoleLabel}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2 items-center px-0.5 py-1.5">
            {stickySection}
            {yearSelect}
          </div>
          {interestSummary}
          {nameMonthHeader}
        </div>
      ) : (
        <div className="mb-3 lg:mb-6">
          {yearControlsDesktop}
          {interestSummary}
        </div>
      )}

      {!ready ? (
        <p className="text-center font-mono text-[10px] text-muted py-8">
          Loading table…
        </p>
      ) : (
        <>
          {!unifiedSticky ? (
            <div className="sticky top-[104px] lg:top-[112px] z-30 flex">
              <div
                className={`${nameFixedClass} flex items-center justify-center px-3 h-12 text-xs font-bold uppercase tracking-widest text-muted z-30`}
              >
                Name
              </div>
              {hasFixedCapital ? (
                <div
                  className={`${CAPITAL_COL} flex items-center justify-center h-12 text-[9px] sm:text-xs font-bold uppercase tracking-widest text-muted ${FIXED_SHADOW} z-20`}
                >
                  {formatColumnLabel(TABLE_CAPITAL)}
                </div>
              ) : null}
              <div
                ref={headerScrollRef}
                onScroll={() =>
                  syncScroll(headerScrollRef.current, bodyScrollRef.current)
                }
                className={SCROLL_X_CLASS}
                style={SCROLL_X_STYLE}
              >
                {monthsAndTotalHeader}
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden -mx-1 sm:mx-0">
            <div className="flex">
              <div className={`${nameFixedClass} z-10`}>
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="h-9 sm:h-12 flex items-center justify-start px-0.5 sm:px-2"
                  >
                    <input
                      type="text"
                      value={row.name}
                      readOnly={!canEdit}
                      onChange={(e) =>
                        updateRow(row.id, { name: e.target.value })
                      }
                      placeholder={canEdit ? "Name" : "—"}
                      className={`w-full min-w-0 h-full px-0.5 sm:px-1.5 text-xs sm:text-sm text-left outline-none ${inputClass}`}
                    />
                  </div>
                ))}
                <div className="h-9 sm:h-12 flex items-center justify-start px-0.5 sm:px-2">
                  <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-ink px-0.5">
                    Total
                  </span>
                </div>
              </div>

              {fixedCapitalBody}

              <div
                ref={bodyScrollRef}
                onScroll={() =>
                  syncScroll(bodyScrollRef.current, headerScrollRef.current)
                }
                className={SCROLL_X_CLASS}
                style={SCROLL_X_STYLE}
              >
                <div className="min-w-max">
                  {rows.map((row, i) => (
                    <div
                      key={row.id}
                      className="h-9 sm:h-12 flex items-stretch"
                    >
                      {scrollColumns.map((m) => (
                        <div
                          key={m}
                          className={`${MONTH_COL} flex items-center px-0.5 sm:px-1`}
                        >
                          <input
                            type="text"
                            value={formatCellAmount(row.values?.[m])}
                            readOnly={!canEdit}
                            onChange={(e) => {
                              const next = e.target.value.trim();
                              updateCell(
                                row.id,
                                m,
                                next === "" ? "" : String(parseAmount(next)),
                              );
                            }}
                            className={`w-full h-full px-0 sm:px-1 text-xs sm:text-sm text-center outline-none ${inputClass}`}
                          />
                        </div>
                      ))}
                      <div
                        className={`${TOTAL_COL} flex items-center justify-center px-0.5`}
                      >
                        <span className="text-[10px] sm:text-xs font-semibold text-ink tabular-nums">
                          {formatTotal(rowTotals[i])}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="h-9 sm:h-12 flex items-stretch">
                    {scrollColumns.map((m) => (
                      <div
                        key={m}
                        className={`${MONTH_COL} flex items-center justify-center px-0.5`}
                      >
                        <span className="text-[10px] sm:text-xs font-bold text-ink tabular-nums">
                          {formatTotal(monthTotals[m])}
                        </span>
                      </div>
                    ))}
                    <div
                      className={`${TOTAL_COL} flex items-center justify-center px-0.5`}
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-ink tabular-nums">
                        {formatTotal(yearTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {canEdit ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-zinc-200 bg-white text-xs font-bold uppercase tracking-widest text-ink hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <span className="text-lg leading-none">+</span>
                Add row
              </button>
            </div>
          ) : null}

          {saveError ? (
            <p className="mt-3 text-center text-xs text-red-600">{saveError}</p>
          ) : null}
        </>
      )}
    </section>
  );
}

const SECTIONS = [
  {
    id: "collection",
    caption: "Pawlpi Collection",
    storeDocId: PAWLPI_COLLECTION_DOC,
    getMonths: collectionColumns,
    formatColumnLabel: (col) => (col === TABLE_CAPITAL ? "CAPITAL" : col),
    excludeCapitalFromTotal: true,
  },
  {
    id: "loan",
    caption: "Pawlpi Loan",
    storeDocId: PAWLPI_LOAN_DOC,
    getMonths: loanColumns,
    formatColumnLabel: (col) => (col === TABLE_CAPITAL ? "CAPITAL" : col),
    excludeCapitalFromTotal: true,
    showInterestTotal: true,
  },
];

export default function Pawlpisum({
  canEdit = false,
  role = null,
  selectedYear = 2026,
  onYearChange,
  years = [2026, 2027],
  hideYearPicker = true,
}) {
  const [mobileSection, setMobileSection] = useState("collection");
  const roleLabel = role ? (canEdit ? "Editor" : "Member") : null;

  const mobileSectionSelect = (
    <PawlpiSelect
      value={mobileSection}
      onChange={setMobileSection}
      ariaLabel="Section"
      options={SECTIONS.map((s) => ({
        value: s.id,
        label: s.caption.replace(/^Pawlpi\s+/i, ""),
      }))}
    />
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-2 lg:space-y-20">
      {roleLabel ? (
        <p className="hidden lg:block text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-4">
          {roleLabel}
        </p>
      ) : null}

      <div className="lg:hidden">
        {SECTIONS.filter((s) => s.id === mobileSection).map((s) => (
          <YearTableSection
            key={s.id}
            caption={s.caption}
            storeDocId={s.storeDocId}
            getMonths={s.getMonths}
            canEdit={canEdit}
            hideCaption
            unifiedSticky
            stickyRoleLabel={roleLabel}
            stickySection={mobileSectionSelect}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
            years={years}
            hideYearPicker={hideYearPicker}
            formatColumnLabel={s.formatColumnLabel}
            excludeCapitalFromTotal={s.excludeCapitalFromTotal}
            showInterestTotal={s.showInterestTotal}
          />
        ))}
      </div>

      <div className="hidden lg:block space-y-20">
        {SECTIONS.map((s) => (
          <YearTableSection
            key={s.id}
            caption={s.caption}
            storeDocId={s.storeDocId}
            getMonths={s.getMonths}
            canEdit={canEdit}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
            years={years}
            hideYearPicker={hideYearPicker}
            formatColumnLabel={s.formatColumnLabel}
            excludeCapitalFromTotal={s.excludeCapitalFromTotal}
            showInterestTotal={s.showInterestTotal}
          />
        ))}
      </div>
    </div>
  );
}
