import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, ChevronDown, X, Download, Check, Search, Calendar } from "lucide-react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormGroup, FormControlLabel, Checkbox, Button, Divider,
  Select, MenuItem,
} from "@mui/material";
import api from "../../services/api";
import type { Transaction } from "../../types";
import AlertChip from "../AlertChip";

const COLORS = {
  panel: "#1a1c22",
  searchBg: "#282c35",
  border: "#242530",
  text: "#fff",
  muted: "#9ca3af",
  accent: "#1ed760",
  input: "#08090b",
};

const EXPORTABLE_COLUMNS: { key: keyof Transaction; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "user_id", label: "User ID" },
];

type SortField = "date" | "amount" | "category" | "status" | "user_id";
type SortOrder = "asc" | "desc";

interface Filters {
  category: string;
  status: string;
  user_id: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FILTERS: Filters = {
  category: "",
  status: "",
  user_id: "",
  minAmount: "",
  maxAmount: "",
  startDate: "",
  endDate: "",
};



const inputStyle: React.CSSProperties = {
  background: COLORS.searchBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 10px",
  color: COLORS.text,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
};

const selectSx = {
  background: COLORS.searchBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "8px",
  color: COLORS.text,
  fontSize: 13,
  fontFamily: "inherit",
  height: 36,
  width: "100%",
  boxSizing: "border-box",
  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
  "& .MuiSelect-select": { padding: "8px 28px 8px 10px" },
  "& .MuiSvgIcon-root": { color: COLORS.muted },
};

const selectMenuProps = {
  slotProps: {
    paper: {
      sx: {
        background: COLORS.searchBg,
        color: COLORS.text,
        "& .MuiMenuItem-root:hover": { background: COLORS.border },
        "& .MuiMenuItem-root.Mui-selected": { background: `${COLORS.accent}22` },
        "& .MuiMenuItem-root.Mui-selected:hover": { background: `${COLORS.accent}33` },
      },
    },
  },
};

export default function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const dateRangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dateRangeRef.current && !dateRangeRef.current.contains(e.target as Node)) {
        setDateRangeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatShortDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const [debouncedUserId, setDebouncedUserId] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const dateRangeLabel = (() => {
    const { startDate, endDate } = filters;
    if (!startDate && !endDate) return "Select dates";
    if (startDate && endDate) return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
    if (startDate) return `From ${formatShortDate(startDate)}`;
    return `Until ${formatShortDate(endDate)}`;
  })();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedCols, setSelectedCols] = useState<string[]>(
    EXPORTABLE_COLUMNS.map((c) => c.key)
  );

  function toggleCol(key: string) {
    setSelectedCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }
  const allSelected = selectedCols.length === EXPORTABLE_COLUMNS.length;
  function toggleAll() {
    setSelectedCols(allSelected ? [] : EXPORTABLE_COLUMNS.map((c) => c.key));
  }

    async function handleExport() {
    if (selectedCols.length === 0) {
      setError("Select at least one column to export");
      return;
    }
    setExporting(true);
    try {
      const filterBody: Record<string, any> = {};
      if (debouncedSearch) filterBody.search = debouncedSearch;
      if (filters.category) filterBody.category = filters.category;
      if (filters.status) filterBody.status = filters.status;
      if (debouncedUserId) filterBody.user_id = debouncedUserId;
      if (filters.minAmount) filterBody.minAmount = filters.minAmount;
      if (filters.maxAmount) filterBody.maxAmount = filters.maxAmount;
      if (filters.startDate) filterBody.startDate = filters.startDate;
      if (filters.endDate) filterBody.endDate = filters.endDate;

      const res = await api.post(
        "/transactions/export",
        { columns: selectedCols, filters: filterBody, sortBy: sortField, order: sortOrder },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      link.href = url;
      link.setAttribute("download", `transactions_export_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  }

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // debounce user_id filter
  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserId(filters.user_id), 400);
    return () => clearTimeout(t);
  }, [filters.user_id]);

  // reset to page 1 whenever filters/search/sort change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedUserId, sortField, sortOrder, filters]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          page,
          limit,
          sortBy: sortField,
          order: sortOrder,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (filters.category) params.category = filters.category;
        if (filters.status) params.status = filters.status;
        if (debouncedUserId) params.user_id = debouncedUserId;
        if (filters.minAmount) params.minAmount = filters.minAmount;
        if (filters.maxAmount) params.maxAmount = filters.maxAmount;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const res = await api.get("/transactions", { params });
        const data = res.data?.transactions ?? res.data?.data ?? res.data;
        const totalCount = res.data?.total ?? (Array.isArray(data) ? data.length : 0);

        if (!cancelled) {
          setTransactions(Array.isArray(data) ? data : []);
          setTotal(totalCount);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load transactions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [page, limit, debouncedSearch, debouncedUserId, sortField, sortOrder, filters]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setSearch("");
  }

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length + (search ? 1 : 0),
    [filters, search]
  );

  const columns: { key: SortField; label: string }[] = [
    { key: "user_id", label: "User" },
    { key: "date", label: "Date" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
  ];

  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 24,
      }}
    >
      <style>{`
        .txn-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .txn-search-group { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; min-width: 200px; flex-wrap: wrap; }
        .txn-search-box { position: relative; width: 100%; max-width: 320px; }
        .txn-daterange { position: relative; }
        .txn-daterange-btn { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .txn-daterange-label { display: inline; }
        .txn-daterange-panel { position: absolute; top: calc(100% + 8px); right: 0; z-index: 20; min-width: 220px; }
        @media (max-width: 640px) {
          .txn-search-group { justify-content: stretch; }
          .txn-search-box { max-width: none; }
          .txn-daterange { width: 100%; }
          .txn-daterange-btn { width: 100%; justify-content: center; }
          .txn-daterange-panel { left: 0; right: 0; min-width: 0; }
        }
      `}</style>
      <div className="txn-header-row">
        <h3 style={{ color: COLORS.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Transactions</h3>

        <div className="txn-search-group">
          <div className="txn-search-box">
            <Search
              size={15}
              color={COLORS.muted}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for anything…"
              style={{
                ...inputStyle,
                borderRadius: 10,
                width: "100%",
                paddingLeft: 34,
              }}
            />
          </div>

          <div className="txn-daterange" ref={dateRangeRef}>
            <button
              type="button"
              className="txn-daterange-btn"
              onClick={() => setDateRangeOpen((o) => !o)}
              style={{
                ...inputStyle,
                borderRadius: 10,
                cursor: "pointer",
                color: filters.startDate || filters.endDate ? COLORS.text : COLORS.muted,
              }}
            >
              <Calendar size={14} />
              <span className="txn-daterange-label">{dateRangeLabel}</span>
            </button>

            {dateRangeOpen && (
              <div
                className="txn-daterange-panel"
                style={{
                  background: COLORS.panel,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ color: COLORS.muted, fontSize: 12 }}>From</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => updateFilter("startDate", e.target.value)}
                    style={{ ...inputStyle, colorScheme: "dark", width: "100%" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ color: COLORS.muted, fontSize: 12 }}>To</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => updateFilter("endDate", e.target.value)}
                    style={{ ...inputStyle, colorScheme: "dark", width: "100%" }}
                  />
                </div>
                {(filters.startDate || filters.endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      updateFilter("startDate", "");
                      updateFilter("endDate", "");
                    }}
                    style={{
                      background: "transparent",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      padding: "6px 10px",
                      color: COLORS.muted,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Clear dates
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setExportOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: COLORS.accent,
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 10,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <Select
          value={`${sortField === "date" ? sortOrder : ""}`}
          onChange={(e) => {
            const v = e.target.value as string;
            if (v === "desc" || v === "asc") {
              setSortField("date");
              setSortOrder(v);
            }
          }}
          displayEmpty
          renderValue={(v) => (v === "desc" ? "Latest first" : v === "asc" ? "Oldest first" : "Sort by date")}
          sx={selectSx}
          MenuProps={selectMenuProps}
        >
          <MenuItem value="desc">Latest first</MenuItem>
          <MenuItem value="asc">Oldest first</MenuItem>
        </Select>

        <Select
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value as string)}
          displayEmpty
          renderValue={(v) => (v === "" ? "All Categories" : (v as string))}
          sx={selectSx}
          MenuProps={selectMenuProps}
        >
          <MenuItem value="">All Categories</MenuItem>
          <MenuItem value="Revenue">Revenue</MenuItem>
          <MenuItem value="Expense">Expense</MenuItem>
        </Select>

        <Select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value as string)}
          displayEmpty
          renderValue={(v) => (v === "" ? "All Status" : (v as string))}
          sx={selectSx}
          MenuProps={selectMenuProps}
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="Paid">Paid</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
        </Select>

        <input
          value={filters.user_id}
          onChange={(e) => updateFilter("user_id", e.target.value)}
          placeholder="User ID"
          style={{ ...inputStyle, width: "100%" }}
        />

        <input
          type="number"
          value={filters.minAmount}
          onChange={(e) => updateFilter("minAmount", e.target.value)}
          placeholder="Min $"
          style={{ ...inputStyle, width: "100%" }}
        />
        <input
          type="number"
          value={filters.maxAmount}
          onChange={(e) => updateFilter("maxAmount", e.target.value)}
          placeholder="Max $"
          style={{ ...inputStyle, width: "100%" }}
        />

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "8px 12px",
              color: COLORS.muted,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <X size={14} />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          opacity: loading && transactions.length > 0 ? 0.55 : 1,
          transition: "opacity 0.2s ease",
          pointerEvents: loading && transactions.length > 0 ? "none" : "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    color: COLORS.muted,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    borderBottom: `1px solid ${COLORS.border}`,
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {label}
                    {sortField === key &&
                      (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && transactions.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: "center", color: COLORS.muted }}>
                  Loading…
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: "center", color: COLORS.muted }}>
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t._id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "12px", color: COLORS.text, fontSize: 14 }}>{t.user_id}</td>
                  <td style={{ padding: "12px", color: COLORS.muted, fontSize: 14 }}>
                    {new Date(t.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).replace(", ", ",")}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: t.category === "Revenue" ? COLORS.accent : "#f5a623",
                    }}
                  >
                    {t.category === "Revenue" ? "+" : "-"}${t.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 76,
                        textAlign: "center",
                        padding: "4px 0",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: t.status === "Paid" ? "#1ed76022" : "#f59e0b22",
                        color: t.status === "Paid" ? COLORS.accent : "#f59e0b",
                      }}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
        <span style={{ color: COLORS.muted, fontSize: 13 }}>
          Page {page} of {totalPages} · {total} total
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...inputStyle,
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              ...inputStyle,
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>

              <Dialog
        open={exportOpen}
        onClose={() => !exporting && setExportOpen(false)}
        sx={{
          "& .MuiPaper-root": {
            background: COLORS.panel,
            backgroundImage: "none",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            minWidth: 360,
          },
        }}
      >
        <DialogTitle style={{ color: COLORS.text, fontSize: 16, fontWeight: 700 }}>
          Export Transactions
        </DialogTitle>
        <DialogContent>
          <p style={{ color: COLORS.muted, fontSize: 13, margin: "0 0 12px" }}>
            Choose columns to include. Export matches your current search,
            filters, and sort order —{" "}
            {activeFilterCount > 0
              ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`
              : "no filters active, exports everything"}.
          </p>
          <Divider style={{ borderColor: COLORS.border, marginBottom: 8 }} />
          <button
            onClick={toggleAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              color: COLORS.accent,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              padding: "8px 0",
            }}
          >
            <Check size={14} />
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          <FormGroup>
            {EXPORTABLE_COLUMNS.map(({ key, label }) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={selectedCols.includes(key)}
                    onChange={() => toggleCol(key)}
                    sx={{
                      color: COLORS.border,
                      "&.Mui-checked": { color: COLORS.accent },
                    }}
                  />
                }
                label={<span style={{ color: COLORS.text, fontSize: 14 }}>{label}</span>}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions style={{ padding: "12px 24px 20px" }}>
          <Button
            onClick={() => setExportOpen(false)}
            disabled={exporting}
            style={{ color: COLORS.muted, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || selectedCols.length === 0}
            style={{
              background: COLORS.accent,
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              opacity: exporting || selectedCols.length === 0 ? 0.6 : 1,
            }}
          >
            {exporting ? "Exporting…" : `Export ${selectedCols.length} column${selectedCols.length === 1 ? "" : "s"}`}
          </Button>
        </DialogActions>
      </Dialog>

      <AlertChip open={!!error} message={error || ""} severity="error" onClose={() => setError(null)} />
    </div>
  );
}