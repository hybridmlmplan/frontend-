import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./redux/authSlice";
import userReducer from "./redux/userSlice";
import packageReducer from "./redux/packageSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    package: packageReducer
  }
});

export default store;
