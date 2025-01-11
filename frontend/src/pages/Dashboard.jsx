import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchFiles, uploadFile } from "../store/fileSlice";
import { logout } from "../store/authSlice";
import api from "../utils/api";
import Header from "../components/common/Header";

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { files, loading, uploadLoading } = useSelector((state) => state.files);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (!uploadLoading) {
      dispatch(fetchFiles());
    }
  }, [dispatch, uploadLoading]);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setFileName(event.target.files[0].name);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFile && fileName) {
      dispatch(uploadFile({ file: selectedFile, fileName }));
      setSelectedFile(null);
      setFileName("");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/users/auth/logout");
      sessionStorage.removeItem("isMFAVerified");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logout button */}
      <Header title={"Dashboard"} navigate={navigate} handleLogout={handleLogout} />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Username:</span>
              <span className="font-semibold">{user?.username}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Role:</span>
              <span className="font-semibold capitalize">
                {user?.role?.toLowerCase()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Account Created:</span>
              <span className="font-semibold">
                {new Date(user?.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload File</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <input
                type="file"
                onChange={handleFileSelect}
                disabled={uploadLoading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={!selectedFile || uploadLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md
                hover:bg-blue-700 focus:outline-none focus:ring-2
                focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50"
            >
              {uploadLoading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>

        {/* File List Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">My Files</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
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
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
