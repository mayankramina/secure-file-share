import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../utils/api';
import { setMFAEnabled } from '../store/authSlice';

function MFASetup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMFASetupData();
  }, []);

  const fetchMFASetupData = async () => {
    try {
      const response = await api.post('/users/auth/mfa/setup');
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
    } catch (error) {
      console.error('Failed to fetch MFA setup data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/users/auth/mfa/verify', { token });
    } catch (error) {
      console.error('MFA verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set up Two-Factor Authentication
          </h2>
        </div>

        <div className="space-y-6">
          {qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <img src={qrCode} alt="MFA QR Code" className="w-64 h-64" />
              <p className="text-sm text-gray-600">
                Scan this QR code with your authenticator app
              </p>
              <div className="text-sm">
                <p className="font-medium">Manual entry code:</p>
                <p className="font-mono bg-gray-100 p-2 rounded">{secret}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                Enter verification code
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify and Enable MFA'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MFASetup; 