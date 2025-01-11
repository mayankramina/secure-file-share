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

const initialState = {
  files: [],
  currentFile: null,
  loading: false,
  uploadLoading: false,
  error: null
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
        state.currentFile = action.payload;
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
      });
  }
});

export const { clearCurrentFile, clearError } = fileSlice.actions;
export default fileSlice.reducer; 