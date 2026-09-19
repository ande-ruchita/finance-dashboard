import { useEffect, useState } from "react";
import api from "../../services/api";
import type { Transaction } from "../../types";

const COLORS = {
  panel: "#1a1c22",
  border: "#242530",
  text: "#fff",
  muted: "#9ca3af",
  accent: "#1ed760",
  expense: "#f5a623",
};

export default function RecentTransactions() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchRecent() {
      try {
        const res = await api.get("/transactions", {
          params: { page: 1, limit: 3, sortField: "date", sortOrder: "desc" },
        });
        const data = res.data?.transactions ?? res.data?.data ?? res.data;
        if (!cancelled) setItems(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRecent();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 24,
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ color: COLORS.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Recent Transaction</h3>
        <span
          onClick={() => {
            document.getElementById("transactions-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
            window.history.replaceState(null, "", "/dashboard#transactions-table");
          }}
          style={{ color: COLORS.accent, fontSize: 13, cursor: "pointer" }}
        >
          See all
        </span>
      </div>

      {loading ? (
        <div style={{ color: COLORS.muted, fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {items.map((t) => (
            <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  flexShrink: 0,
                  overflow: "hidden",
                  background: COLORS.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  position: "relative",
                }}
              >
                <span style={{ position: "absolute" }}>
                  {t.user_id?.replace("user_", "").slice(-2).toUpperCase() || "U"}
                </span>
                <img
                  src={t.user_profile}
                  alt={t.user_id}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", position: "relative", zIndex: 1 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color: COLORS.muted, fontSize: 13 }}>
                  {t.category === "Revenue" ? "Transfer from" : "Transfer to"}
                </div>
                <div style={{ color: COLORS.text, fontSize: 17, fontWeight: 700 }}>{t.user_id}</div>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.category === "Revenue" ? COLORS.accent : COLORS.expense,
                  flexShrink: 0,
                }}
              >
                {t.category === "Revenue" ? "+" : "-"}${t.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}