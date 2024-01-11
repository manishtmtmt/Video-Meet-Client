// eslint-disable-next-line no-unused-vars
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export const IsStudent = ({ children }) => {
  const navigate = useNavigate();
  const {
    data: { userType },
  } = useSelector((state) => state.authReducer);

  useEffect(() => {
    if (userType !== "student") navigate("/");
  }, [userType, navigate]);

  return children;
};
