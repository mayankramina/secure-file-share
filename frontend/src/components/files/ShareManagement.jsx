import { useState, useEffect } from 'react';
import { fetchFileShares, addFileShare, updateFileShare, deleteFileShare } from "../../store/fileSlice";
import { useDispatch, useSelector } from 'react-redux';
import { sanitizeInput } from '../../utils/sanitize';

const ShareManagement = ({ fileId }) => {
  const dispatch = useDispatch();
  const { currentFile, shareLoading } = useSelector((state) => state.files);
  const shares = currentFile?.shares;
  const [username, setUsername] = useState('');
  const [permissionType, setPermissionType] = useState('VIEW');
  const [editingShareId, setEditingShareId] = useState(null);

  useEffect(() => {
    dispatch(fetchFileShares(fileId));
  }, [dispatch, fileId]);

  const handleAddShare = async () => {
    await dispatch(addFileShare({ 
      fileId, 
      username, 
      permission_type: permissionType 
    }));
    await dispatch(fetchFileShares(fileId));
    setUsername('');
    setPermissionType('VIEW');
  };

  const handleUpdateShare = async (shareId, newPermissionType, sharedUsername) => {
    await dispatch(updateFileShare({ 
      fileId, 
      shareId, 
      username: sharedUsername,
      permission_type: newPermissionType 
    }));
    await dispatch(fetchFileShares(fileId));
    setEditingShareId(null);
  };

  const handleDeleteShare = async (shareId, sharedUsername) => {
    await dispatch(deleteFileShare({ 
      fileId, 
      shareId,
      username: sharedUsername 
    }));
    await dispatch(fetchFileShares(fileId));
  };

  const handleUsernameChange = (e) => {
    setUsername(sanitizeInput(e.target.value));
  };

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-lg font-medium">Share Management</h3>
      
      {/* Add Share Form */}
      <div className="flex space-x-4">
        <input
          type="text"
          value={username}
          onChange={handleUsernameChange}
          placeholder="Enter username"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2"
        />
        <select
          value={permissionType}
          onChange={(e) => setPermissionType(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="VIEW">View</option>
          <option value="DOWNLOAD">Download</option>
        </select>
        <button
          onClick={handleAddShare}
          disabled={!username || shareLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md
            hover:bg-green-700 focus:outline-none focus:ring-2
            focus:ring-green-500 focus:ring-offset-2
            disabled:opacity-50"
        >
          Share
        </button>
      </div>

      {/* Shares List */}
      {shareLoading ? (
        <p>Loading shares...</p>
      ) : (
        <div className="space-y-4">
          {shares?.map((share) => (
            <div key={share.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
              <div>
                <p className="font-medium">{share.shared_with_username}</p>
                {editingShareId === share.id ? (
                  <select
                    value={share.permission_type}
                    onChange={(e) => handleUpdateShare(share.id, e.target.value, share.shared_with_username)}
                    className="mt-1 rounded-md border border-gray-300 px-2 py-1"
                  >
                    <option value="VIEW">View</option>
                    <option value="DOWNLOAD">Download</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-600">
                    Permission: {share.permission_type}
                  </p>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => editingShareId === share.id ? 
                    setEditingShareId(null) : 
                    setEditingShareId(share.id)
                  }
                  className="text-blue-600 hover:text-blue-800"
                >
                  {editingShareId === share.id ? 'Cancel' : 'Edit'}
                </button>
                <button
                  onClick={() => handleDeleteShare(share.id, share.shared_with_username)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShareManagement; 