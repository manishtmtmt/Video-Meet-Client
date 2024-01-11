// eslint-disable-next-line no-unused-vars
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export const PublicRoute = ({ children }) => {
  const navigate = useNavigate();
  const {
    data: { token },
  } = useSelector((state) => state.authReducer);

  useEffect(() => {
    if (token) navigate("/");
  }, [token, navigate]);

  return children;
};
