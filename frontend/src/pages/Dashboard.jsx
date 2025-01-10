import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { logout } from '../store/authSlice';

function Dashboard() {
  const navigate = useNavigate();
  const { user} = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await api.post('/users/auth/logout');
      sessionStorage.removeItem('isMFAVerified');
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logout button */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Username:</span>
              <span className="font-semibold">{user?.username}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Role:</span>
              <span className="font-semibold capitalize">{user?.role?.toLowerCase()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Account Created:</span>
              <span className="font-semibold">
                {new Date(user?.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;