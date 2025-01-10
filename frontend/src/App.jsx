import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProtectedRoute } from './components/AuthProtectedRoute';
import { AuthAndMFAProtectedRoute } from './components/AuthAndMFAProtectedRoute';
import { NonAuthRoute } from './components/NonAuthRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import MFASetup from './pages/MFASetup';
import MFALogin from './pages/MFALogin';
import Dashboard from './pages/Dashboard';
import { fetchUserDetails } from './store/authSlice';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
      dispatch(fetchUserDetails());
  }, [dispatch]);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/register" element={<NonAuthRoute><Register /></NonAuthRoute>} />
          <Route path="/login" element={<NonAuthRoute><Login /></NonAuthRoute>} />
          <Route 
            path="/mfa/setup" 
            element={
              <AuthProtectedRoute>
                <MFASetup />
              </AuthProtectedRoute>
            } 
          />
          <Route 
            path="/mfa" 
            element={
              <AuthProtectedRoute>
                <MFALogin />
              </AuthProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <AuthAndMFAProtectedRoute>
                <Dashboard />
              </AuthAndMFAProtectedRoute>
            } 
          />
          <Route path="/*" element={<AuthAndMFAProtectedRoute />} />
        </Routes>
      </Router>
      <ToastContainer />
    </>
  );
}

export default App;
