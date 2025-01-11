import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Header from '../components/common/Header';

function ShareLink() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyLink = async () => {
      try {
        const response = await api.post('/files/links/verify', { token });
        navigate(`/files/${response.data.file_id}`);
      } catch (err) {
        setError(err.response?.data?.error || 'Invalid or expired link');
        setLoading(false);
      }
    };

    verifyLink();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Verifying Link" />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-gray-500">Verifying shared link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Invalid Link" />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">{error}</p>
      </div>
    </div>
  );
}

export default ShareLink; 