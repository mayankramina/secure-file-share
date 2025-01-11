import { useState } from 'react';
import api from '../../utils/api';

function LinkGeneration({ fileId }) {
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateLink = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/files/${fileId}/links/generate`);
      const shareableLink = `https://localhost:3000/share/${response.data.token}`;
      setGeneratedLink(shareableLink);
    } catch (err) {
      setError('Failed to generate link');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
  };

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Share via Link</h3>
      
      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      <div className="flex flex-col space-y-4">
        <button
          onClick={generateLink}
          disabled={loading}
          className="inline-flex justify-center px-4 py-2 w-fit
            border border-transparent text-sm font-medium rounded-md
            text-white bg-blue-600 hover:bg-blue-700 focus:outline-none
            focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Shareable Link'}
        </button>

        {generatedLink && (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={generatedLink}
              readOnly
              className="flex-1 p-2 border rounded-md"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 text-sm font-medium text-blue-600
                hover:text-blue-500 focus:outline-none focus:underline"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LinkGeneration; 