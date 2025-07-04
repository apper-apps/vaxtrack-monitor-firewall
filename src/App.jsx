import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Layout from '@/components/organisms/Layout'
import Dashboard from '@/components/pages/Dashboard'
import Receiving from '@/components/pages/Receiving'
import Inventory from '@/components/pages/Inventory'
import Administration from '@/components/pages/Administration'
import Reconciliation from '@/components/pages/Reconciliation'
import LossReport from '@/components/pages/LossReport'
import Reports from '@/components/pages/Reports'
import Settings from '@/components/pages/Settings'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/receiving" element={<Receiving />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/administration" element={<Administration />} />
            <Route path="/reconciliation" element={<Reconciliation />} />
            <Route path="/loss-report" element={<LossReport />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </Router>
  )
}

export default App