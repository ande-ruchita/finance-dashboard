import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatCards from "../components/dashboard/StatCards";
import OverviewChart from "../components/dashboard/OverviewChart";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import TransactionTable from "../components/dashboard/TransactionTable";

export default function Dashboard() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#transactions-table") {
      const el = document.getElementById("transactions-table");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.hash]);

  return (
    <DashboardLayout title="Dashboard">
      <style>{`
        @media (max-width: 1024px) {
          .overview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <StatCards />
      <div
        className="overview-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginBottom: 32,
          alignItems: "stretch",
        }}
      >
        <OverviewChart />
        <RecentTransactions />
      </div>
      <div id="transactions-table">
        <TransactionTable />
      </div>
    </DashboardLayout>
  );
}