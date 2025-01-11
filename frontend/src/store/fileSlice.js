import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';
import { 
  importRSAPublicKey, 
  generateAESKey, 
  encryptFile, 
  encryptAESKey 
} from '../utils/crypto';

// Thunks
export const fetchFiles = createAsyncThunk(
  'files/fetchFiles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/files/list');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getFileDetails = createAsyncThunk(
  'files/getFileDetails',
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const uploadFile = createAsyncThunk(
  'files/uploadFile',
  async ({ file, fileName }, { rejectWithValue }) => {
    try {
      // Get public key from KMS
      const keyResponse = await api.post('/kms/key');
      const publicKey = await importRSAPublicKey(keyResponse.data.public_key);

      // Generate AES key and encrypt file
      const aesKey = await generateAESKey();
      const encryptedFile = await encryptFile(file, aesKey);
      
      // Encrypt AES key with RSA public key
      const encryptedKey = await encryptAESKey(aesKey, publicKey);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', new Blob([encryptedFile]));
      formData.append('file_name', fileName);
      formData.append('encrypted_key', encryptedKey);

      const response = await api.post('/files/upload', formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchFileShares = createAsyncThunk(
  'files/fetchFileShares',
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/files/${fileId}/shares/list`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const addFileShare = createAsyncThunk(
  'files/addFileShare',
  async ({ fileId, username, permission_type }, { rejectWithValue }) => {
    try {
      // If permission includes download, grant KMS access first
      if (permission_type === 'DOWNLOAD') {
        await api.post('/kms/access/grant', { username });
      }

      await api.post(`/files/${fileId}/shares/add`, {
        shared_with_username: username,
        permission_type
      });
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateFileShare = createAsyncThunk(
  'files/updateFileShare',
  async ({ fileId, shareId, permission_type, username }, { rejectWithValue }) => {
    try {
      // If permission is being updated to include download, grant KMS access
      if (permission_type === 'DOWNLOAD') {
        await api.post('/kms/access/grant', { username });
      }

      await api.put(`/files/${fileId}/shares/${shareId}`, {
        permission_type
      });
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteFileShare = createAsyncThunk(
  'files/deleteFileShare',
  async ({ fileId, shareId, username }, { rejectWithValue }) => {
    try {
      await api.delete(`/files/${fileId}/shares/${shareId}/delete`);
      
      // Always revoke KMS access when removing share
      await api.post('/kms/access/revoke', { username });
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchFilePermission = createAsyncThunk(
  'files/fetchFilePermission',
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/files/${fileId}/permission`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchSharedFiles = createAsyncThunk(
  'files/fetchSharedFiles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/files/shares/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  files: [],
  sharedFiles: [],
  currentFile: null,
  loading: false,
  sharedFilesLoading: false,
  uploadLoading: false,
  error: null,
  shareLoading: false,
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    clearCurrentFile: (state) => {
      state.currentFile = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Files
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error;
      })
      // Get File Details
      .addCase(getFileDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFileDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFile = {
          ...action.payload,
          permission: null
        };
      })
      .addCase(getFileDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error;
      })
      // Upload File
      .addCase(uploadFile.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state) => {
        state.uploadLoading = false;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload?.error;
      })
      // Fetch Shares
      .addCase(fetchFileShares.pending, (state) => {
        state.shareLoading = true;
        state.error = null;
      })
      .addCase(fetchFileShares.fulfilled, (state, action) => {
        state.shareLoading = false;
        if (state.currentFile) {
          state.currentFile.shares = action.payload;
        }
      })
      .addCase(fetchFileShares.rejected, (state, action) => {
        state.shareLoading = false;
        state.error = action.payload?.error;
      })
      
      // Add Share
      .addCase(addFileShare.pending, (state) => {
        state.shareLoading = true;
        state.error = null;
      })
      .addCase(addFileShare.fulfilled, (state) => {
        state.shareLoading = false;
      })
      .addCase(addFileShare.rejected, (state, action) => {
        state.shareLoading = false;
        state.error = action.payload?.error;
      })
      
      // Update Share
      .addCase(updateFileShare.pending, (state) => {
        state.shareLoading = true;
        state.error = null;
      })
      .addCase(updateFileShare.fulfilled, (state) => {
        state.shareLoading = false;
      })
      .addCase(updateFileShare.rejected, (state, action) => {
        state.shareLoading = false;
        state.error = action.payload?.error;
      })
      
      // Delete Share
      .addCase(deleteFileShare.pending, (state) => {
        state.shareLoading = true;
        state.error = null;
      })
      .addCase(deleteFileShare.fulfilled, (state) => {
        state.shareLoading = false;
      })
      .addCase(deleteFileShare.rejected, (state, action) => {
        state.shareLoading = false;
        state.error = action.payload?.error;
      })
      // File Permission
      .addCase(fetchFilePermission.fulfilled, (state, action) => {
        if (state.currentFile) {
          state.currentFile.permission = action.payload;
        }
      })
      .addCase(fetchFilePermission.rejected, (state, action) => {
        state.error = action.payload?.error;
      })
      // Shared Files
      .addCase(fetchSharedFiles.pending, (state) => {
        state.sharedFilesLoading = true;
        state.error = null;
      })
      .addCase(fetchSharedFiles.fulfilled, (state, action) => {
        state.sharedFilesLoading = false;
        state.sharedFiles = action.payload;
      })
      .addCase(fetchSharedFiles.rejected, (state, action) => {
        state.sharedFilesLoading = false;
        state.error = action.payload?.error;
      });
  }
});

export const { clearCurrentFile, clearError } = fileSlice.actions;
export default fileSlice.reducer; 