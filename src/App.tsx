import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import ServiceManagement from "./components/ServiceManagement";
import InventoryManagement from "./components/InventoryManagement";
import CustomerDatabase from "./components/CustomerDatabase";
import FinancialReports from "./components/FinancialReports";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/service" element={<ServiceManagement />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/customers" element={<CustomerDatabase />} />
          <Route path="/finance" element={<FinancialReports />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
