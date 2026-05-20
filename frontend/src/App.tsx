import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import HomePage from './pages/HomePage'
import InboxPage from './pages/inbox/InboxPage'
import CampaignsPage from './pages/CampaignsPage'
import CompliancePage from './pages/CompliancePage'
import AnalyticsPage from './pages/AnalyticsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<DashboardLayout />}>
          <Route path="inbox" element={<InboxPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
