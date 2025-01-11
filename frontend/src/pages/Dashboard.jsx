import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadFile } from "../store/fileSlice";

import Header from "../components/common/Header";
import MyFiles from "../components/files/MyFiles";
import SharedFiles from "../components/files/SharedFiles";

function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { uploadLoading } = useSelector((state) => state.files);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState('my-files');

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }else{
        setSelectedFile();
        setFileName();
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFile && fileName) {
      dispatch(uploadFile({ file: selectedFile, fileName }));
      setSelectedFile(null);
      setFileName("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={"Dashboard"}/>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white w-full shadow rounded-lg p-6 mb-8">
          <div className="flex space-x-8">
            <div className="flex space-x-2">
              <span className="text-gray-600">Username:</span>
              <span className="font-semibold">{user?.username}</span>
            </div>
            <div className="flex space-x-2">
              <span className="text-gray-600">Role:</span>
              <span className="font-semibold capitalize">
                {user?.role?.toLowerCase()}
              </span>
            </div>
            <div className="flex space-x-2">
              <span className="text-gray-600">Account Created:</span>
              <span className="font-semibold">
                {new Date(user?.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {user?.role !== 'GUEST' && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-center">Upload File</h2>
            <form onSubmit={handleUpload} className="flex items-center justify-center space-x-4">
              <input
                type="file"
                onChange={handleFileSelect}
                disabled={uploadLoading}
                className="text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
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
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {user?.role !== 'GUEST' && (
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
              )}
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

          {user?.role === 'GUEST' ? (
            <SharedFiles />
          ) : (
            activeTab === 'my-files' ? <MyFiles /> : <SharedFiles />
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
