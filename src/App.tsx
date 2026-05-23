import { NavLink, Route, Routes } from "react-router-dom";

import {
  DashboardPage,
  OrdersPage,
  CreateOrderPage,
  BundlerPage,
  OrdersIndexPage,
  PerformancePage,
  PerformanceAdvancedPage,
  AnalyticsPage,
  SecurityPage,
  ConcurrencyPage,
  MetaProgrammingPage,
  OptimizationPerformancePage,
} from "@/pages";

import "./App.scss";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/orders", label: "Orders" },
  { to: "/create", label: "Create" },
  { to: "/bundler", label: "Bundler" },
  { to: "/orders-index", label: "Index Demo" },
  { to: "/performance", label: "Performance" },
  { to: "/performance-advanced", label: "Performance advanced" },
  { to: "/analytics", label: "Analytics" },
  { to: "/security", label: "Security" },
  { to: "/concurrency", label: "Concurrency" },
  { to: "/metaprogramming", label: "Metaprogramming" },
  { to: "/optimization-performance", label: "Optimization Performance" },
] as const;

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `app__nav-link${isActive ? " app__nav-link--active" : ""}`;

export function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div className="app__title">Orders Admin</div>

        <nav className="app__nav">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={getNavLinkClassName}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app__main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/create" element={<CreateOrderPage />} />
          <Route path="/bundler" element={<BundlerPage />} />
          <Route path="/orders-index" element={<OrdersIndexPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route
            path="/performance-advanced"
            element={<PerformanceAdvancedPage />}
          />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/concurrency" element={<ConcurrencyPage />} />
          <Route path="/metaprogramming" element={<MetaProgrammingPage />} />
          <Route
            path="/optimization-performance"
            element={<OptimizationPerformancePage />}
          />
        </Routes>
      </main>
    </div>
  );
}
