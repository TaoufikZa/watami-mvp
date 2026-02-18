import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Storefront from './pages/Storefront';
import Checkout from './pages/Checkout';
import Discovery from './pages/Discovery';
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import WhatsAppSim from './pages/WhatsAppSim';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Flow A: Storefront */}
        <Route path="/m/:merchantSlug" element={<Storefront />} />

        {/* Customer Flow: Checkout */}
        <Route path="/checkout" element={<Checkout />} />

        {/* Customer Flow B: Discovery */}
        <Route path="/nearby" element={<Discovery />} />

        {/* WhatsApp Simulator [NEW] */}
        <Route path="/wa-sim" element={<WhatsAppSim />} />

        {/* Merchant Flow */}
        <Route path="/merchant/*" element={<MerchantDashboard />} />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/nearby" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
