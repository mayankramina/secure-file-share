import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function MFALogin() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/users/auth/mfa/verify', { token });
      navigate('/dashboard');
    } catch (error) {
      console.error('MFA verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    setLoading(true);
    try {
      await api.post('/users/auth/mfa/disable');
      navigate('/mfa/setup');
    } catch (error) {
      console.error('MFA disable failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the verification code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter 6-digit code"
              required
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {'Verify'}
            </button>

            <button
              type="button"
              onClick={handleDisableMFA}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {'Setup new MFA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MFALogin; 