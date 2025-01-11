import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSharedFiles } from '../../store/fileSlice';
import { useNavigate } from 'react-router-dom';

const SharedFiles = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sharedFiles, sharedFilesLoading } = useSelector((state) => state.files);

  useEffect(() => {
    dispatch(fetchSharedFiles());
  }, [dispatch]);

  if (sharedFilesLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      {sharedFiles.map((share) => (
        <div
          key={share.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
        >
          <div>
            <h3 className="font-medium">{share.file_name}</h3>
            <p className="text-sm text-gray-500">
              Shared by: {share.shared_by_username}
            </p>
            <p className="text-sm text-gray-500">
              Permission: {share.permission_type}
            </p>
          </div>
          <button
            onClick={() => navigate(`/files/${share.file_id}`)}
            className="px-3 py-1 text-sm bg-gray-100 rounded-md
              hover:bg-gray-200 focus:outline-none focus:ring-2
              focus:ring-gray-500 focus:ring-offset-2"
          >
            View
          </button>
        </div>
      ))}
      {sharedFiles.length === 0 && (
        <p className="text-center text-gray-500">No files shared with you</p>
      )}
    </div>
  );
};

export default SharedFiles; 