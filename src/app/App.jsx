import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { DashboardLayout } from "./components/DashboardLayout";
import { Home } from "./pages/Home";
import { Documentation } from "./pages/Documentation";
import { Login } from "./pages/Login";
import { Overview } from "./pages/dashboard/Overview";
import { Swarms } from "./pages/dashboard/Swarms";
import { Topology } from "./pages/dashboard/Topology";
import { Nodes } from "./pages/dashboard/Nodes";
import { Training } from "./pages/dashboard/Training";
import { Activity } from "./pages/dashboard/Activity";
import { hasViewerSession } from "../lib/dashboardAuth";

function RequireDashboardAccess({ children }) {
  if (!hasViewerSession()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return <BrowserRouter>
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<RequireDashboardAccess><DashboardLayout /></RequireDashboardAccess>}>
              <Route index element={<Overview />} />
              <Route path="swarms" element={<Swarms />} />
              <Route path="topology" element={<Topology />} />
              <Route path="nodes" element={<Nodes />} />
              <Route path="training" element={<Training />} />
              <Route path="activity" element={<Activity />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>;
}
export {
  App as default
};
