import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { DashboardLayout } from "./components/DashboardLayout";
import { Home } from "./pages/Home";
import { Documentation } from "./pages/Documentation";
import { Login } from "./pages/Login";
import { DownloadPage } from "./pages/Download";
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

function PublicLayout() {
  return <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
      <Footer />
    </div>;
}

function App() {
  return <BrowserRouter>
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 min-h-0 overflow-hidden">
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/login" element={<Login />} />
              <Route path="/download" element={<DownloadPage />} />
            </Route>
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
