import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getFileDetails, fetchFilePermission, clearCurrentFile } from "../store/fileSlice";
import api from "../utils/api";
import { base642buf } from "../utils/crypto";
import Header from "../components/common/Header";
import ShareManagement from "../components/files/ShareManagement";

function File() {
  const { fileId } = useParams();
  const dispatch = useDispatch();
  const { currentFile, loading } = useSelector((state) => state.files);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (fileId) {
      dispatch(getFileDetails(fileId));
      dispatch(fetchFilePermission(fileId));
    }
    return () => {
      dispatch(clearCurrentFile());
    };
  }, [dispatch, fileId]);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Get encrypted file content
      const downloadResponse = await api.post(`/files/${fileId}/download`);
      const { encrypted_content, encrypted_key, file_name } =
        downloadResponse.data;

      // Decrypt the AES key using KMS - include key owner username
      const kmsResponse = await api.post("/kms/decrypt", {
        encrypted: encrypted_key,
        key_owner_username: currentFile.uploaded_by_username
      });
      const decryptedAESKeyBase64 = kmsResponse.data.decrypted;

      // Import the decrypted AES key
      const decryptedAESKeyBuffer = base642buf(decryptedAESKeyBase64);
      const aesKey = await crypto.subtle.importKey(
        "raw",
        decryptedAESKeyBuffer,
        {
          name: "AES-GCM",
          length: 256,
        },
        false,
        ["decrypt"]
      );

      // Get encrypted content as ArrayBuffer
      const encryptedData = base642buf(encrypted_content);

      // Extract IV (first 12 bytes) and encrypted content
      const iv = encryptedData.slice(0, 12);
      const encryptedContent = encryptedData.slice(12);

      // Decrypt the file content
      const decryptedContent = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        aesKey,
        encryptedContent
      );

      // Create and download the file
      const blob = new Blob([decryptedContent]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title={"File Details"}  />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentFile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title={"File Details"}/>
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-gray-500">File not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={"File Details"} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <p className="text-xl text-gray-500">
              View and download your encrypted file
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">File Name:</span>
              <span className="font-semibold">{currentFile.file_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Uploaded By:</span>
              <span className="font-semibold">
                {currentFile.uploaded_by_username}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Upload Date:</span>
              <span className="font-semibold">
                {new Date(currentFile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {(currentFile?.permission?.is_owner || 
            currentFile?.permission?.permission_type === 'DOWNLOAD') && (
            <div className="mt-8">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md
                  hover:bg-blue-700 focus:outline-none focus:ring-2
                  focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50"
              >
                {downloading ? "Downloading..." : "Download File"}
              </button>
            </div>
          )}

          {currentFile?.permission?.is_owner && (
            <ShareManagement fileId={fileId} />
          )}
        </div>
      </main>
    </div>
  );
}

export default File;
