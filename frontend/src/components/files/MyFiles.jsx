import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFiles } from "../../store/fileSlice";
import { useNavigate } from "react-router-dom";

const MyFiles = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { files, loading, uploadLoading } = useSelector((state) => state.files);

  useEffect(() => {
    if (!uploadLoading) {
      dispatch(fetchFiles());
    }
  }, [dispatch, uploadLoading]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
        >
          <div>
            <h3 className="font-medium">{file.file_name}</h3>
            <p className="text-sm text-gray-500">
              Uploaded: {new Date(file.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => navigate(`/files/${file.id}`)}
            className="px-3 py-1 text-sm bg-gray-100 rounded-md
              hover:bg-gray-200 focus:outline-none focus:ring-2
              focus:ring-gray-500 focus:ring-offset-2"
          >
            View
          </button>
        </div>
      ))}
      {files.length === 0 && (
        <p className="text-center text-gray-500">No files uploaded yet</p>
      )}
    </div>
  );
};

export default MyFiles;
