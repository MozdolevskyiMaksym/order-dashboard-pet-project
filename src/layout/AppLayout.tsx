import React from "react";
import { NavLink, Outlet } from "react-router-dom";

type NavItem = Readonly<{
  to: string;
  label: string;
  end?: boolean;
}>;

const navItems: ReadonlyArray<NavItem> = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/orders", label: "Orders" },
  { to: "/create", label: "Create" },
  { to: "/bundler", label: "Bundler" },
];

function linkStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    textDecoration: "none",
    background: isActive ? "#f3f3f3" : "transparent",
    color: "inherit",
  };
}

export function AppLayout() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "white",
          borderBottom: "1px solid #eee",
          padding: 12,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>PeeX Pet</div>

          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => linkStyle(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
