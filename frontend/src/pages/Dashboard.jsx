import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchFiles, uploadFile } from "../store/fileSlice";
import { logout } from "../store/authSlice";
import api from "../utils/api";
import Header from "../components/common/Header";
import MyFiles from "../components/files/MyFiles";
import SharedFiles from "../components/files/SharedFiles";

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { uploadLoading } = useSelector((state) => state.files);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState('my-files');

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

        {/* Files Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my-files')}
                className={`${
                  activeTab === 'my-files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
              >
                My Files
              </button>
              <button
                onClick={() => setActiveTab('shared-files')}
                className={`${
                  activeTab === 'shared-files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
              >
                Shared with Me
              </button>
            </nav>
          </div>

          {activeTab === 'my-files' ? <MyFiles /> : <SharedFiles />}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
