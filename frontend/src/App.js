import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import MFASetup from './pages/MFASetup';
import MFALogin from './pages/MFALogin';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/auth" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mfa/setup" element={<MFASetup />} />
          <Route path="/mfa" element={<MFALogin />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default App;
