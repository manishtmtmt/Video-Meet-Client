import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  loading: { isPostSignUpLoading: false, isPostLoginLoading: false },
  error: null,
  data: JSON.parse(localStorage.getItem("user")) || {},
};

export const postSignUp = createAsyncThunk(
  "api/postSignUp",
  async (payload) => {
    try {
      const { data } = await axios.post(
        "http://localhost:8000/api/signup",
        payload
      );
      return data;
    } catch (error) {
      throw new Error(
        error.response ? error.response?.data?.message : error.message
      );
    }
  }
);

export const postLogin = createAsyncThunk("/api/postLogin", async (payload) => {
  try {
    const { data } = await axios.post(
      "http://localhost:8000/api/login",
      payload
    );
    return data;
  } catch (error) {
    throw new Error(
      error.response ? error.response?.data?.message : error.message
    );
  }
});

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state, action) => {
      state.data = {};
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder.addCase(postSignUp.pending, (state) => {
      state.loading.isPostSignUpLoading = true;
    });
    builder.addCase(postSignUp.fulfilled, (state, action) => {
      state.loading.isPostSignUpLoading = false;
    });
    builder.addCase(postSignUp.rejected, (state, action) => {
      state.loading.isPostSignUpLoading = false;
      state.error = action.error.message;
    });
    builder.addCase(postLogin.pending, (state, action) => {
      state.loading.isPostLoginLoading = true;
    });
    builder.addCase(postLogin.fulfilled, (state, action) => {
      state.loading.isPostLoginLoading = false;
      state.data = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    });
    builder.addCase(postLogin.rejected, (state, action) => {
      state.loading.isPostLoginLoading = false;
      state.error = action.error.message;
    });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
