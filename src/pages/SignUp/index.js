import React, { useContext, useEffect, useState } from "react";
import validator from "validator";

import ThemeContext from "../../context/ThemeContext";
import classes from "./index.module.css";
import Toggle from "../../components/Toggler";
import { useDispatch } from "react-redux";
import { postSignUp } from "../../redux/slice/authSlice";
import { useNavigate } from "react-router-dom";

const SignUp = ({ isDark, setIsDark }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    userType: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    console.log("formData: -->", formData);
    // Validation rules
    let newErrors = {};
    if (!formData.username || validator.isEmpty(formData.username)) {
      newErrors = {
        ...newErrors,
        username: "Username is required and must be a non-empty string",
      };
    }

    if (!formData.email || !validator.isEmail(formData.email)) {
      newErrors = {
        ...newErrors,
        email: "Email is required and must be a valid email address",
      };
    }

    if (
      !formData.password ||
      formData.password.length < 8 ||
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password) ||
      !/\d/.test(formData.password) ||
      !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)
    ) {
      newErrors = {
        ...newErrors,
        password:
          "Password is required and must be at least 8 characters long with at least one uppercase letter, one lowercase letter, one digit, and one special character",
      };
    }

    if (
      !formData.userType ||
      (formData.userType !== "teacher" && formData.userType !== "student")
    ) {
      newErrors = {
        ...newErrors,
        userType:
          "UserType is required and must be either 'teacher' or 'student'",
      };
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      // Proceed with form submission
      // For example: You can send formData to an API endpoint
      dispatch(postSignUp(formData)).then((res) => {
        if (res.error) {
          alert(res.error.message);
          return;
        }
        console.log("Form submitted:", formData);
        setErrors({});
        navigate("/login");
      });
    }
  };

  return (
    <div
      className={`${classes.container} ${
        !isDark ? classes.bgLight : classes.bgDark
      }`}
    >
      <div
        style={{
          justifyContent: "end",
          width: "100%",
          display: "flex",
          alignItems: "start",
          position: "fixed",
          top: 0,
        }}
      >
        <Toggle size={60} setIsDark={setIsDark} />
      </div>
      {/* <Toggle size={60} /> */}
      {/* <Header setIsDark={setIsDark} isDark={isDark} /> */}
      <div className={classes.glassBox}>
        <div className={classes.details}>
          <div className={classes.logo}>
            <img src={theme.assets.logo} />
          </div>
          <div className={classes.writeUp}>
            <h4 style={{ color: theme.color.primary }}>Sign Up</h4>
            <p style={{ color: theme.color.light }}>
              Already a user?{" "}
              <span
                onClick={() => navigate("/login")}
                style={{ color: "blue", cursor: "pointer" }}
              >
                LogIn
              </span>
            </p>
          </div>
        </div>
        <div className={classes.formContainer}>
          <div className={classes.form}>
            <input
              type="text"
              name="username"
              placeholder="Name"
              required
              className={classes.input}
              onChange={handleChange}
            />
            {errors.username && (
              <p style={{ color: "red" }}>{errors.username}</p>
            )}
            <input
              type="email"
              name="email"
              placeholder="Email Id"
              required
              className={classes.input}
              onChange={handleChange}
            />
            {errors.email && <p style={{ color: "red" }}>{errors.email}</p>}
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className={classes.input}
              onChange={handleChange}
            />
            {errors.password && (
              <p style={{ color: "red" }}>{errors.password}</p>
            )}
            <p
              className={classes.checkboxText}
              style={{ marginLeft: 0, color: theme.color.light }}
            >
              Select User Type:
            </p>
            <span className={classes.checkBoxSpan}>
              <input
                type="radio"
                name="userType"
                value="student"
                onChange={handleChange}
                style={{ cursor: "pointer" }}
              />
              <label
                className={classes.checkboxText}
                style={{ color: theme.color.light }}
              >
                Student
              </label>
            </span>
            <span className={classes.checkBoxSpan}>
              <input
                type="radio"
                name="userType"
                value="teacher"
                onChange={handleChange}
                style={{ cursor: "pointer" }}
              />
              <label
                className={classes.checkboxText}
                style={{ color: theme.color.light }}
              >
                Teacher
              </label>
            </span>
            {errors.userType && (
              <p style={{ color: "red" }}>{errors.userType}</p>
            )}
            <div className={classes.buttonContainer}>
              <button
                type="button"
                className={classes.loginWithGoogle}
                style={{
                  background: "#0060FF",
                  color: "white",
                  marginBottom: "4vh",
                }}
                onClick={handleSubmit}
              >
                Sign Up
              </button>
              <button type="button" className={classes.loginWithGoogle}>
                <img
                  src={
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTcuNiA5LjJsLS4xLTEuOEg5djMuNGg0LjhDMTMuNiAxMiAxMyAxMyAxMiAxMy42djIuMmgzYTguOCA4LjggMCAwIDAgMi42LTYuNnoiIGZpbGw9IiM0Mjg1RjQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjxwYXRoIGQ9Ik05IDE4YzIuNCAwIDQuNS0uOCA2LTIuMmwtMy0yLjJhNS40IDUuNCAwIDAgMS04LTIuOUgxVjEzYTkgOSAwIDAgMCA4IDV6IiBmaWxsPSIjMzRBODUzIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNNCAxMC43YTUuNCA1LjQgMCAwIDEgMC0zLjRWNUgxYTkgOSAwIDAgMCAwIDhsMy0yLjN6IiBmaWxsPSIjRkJCQzA1IiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNOSAzLjZjMS4zIDAgMi41LjQgMy40IDEuM0wxNSAyLjNBOSA5IDAgMCAwIDEgNWwzIDIuNGE1LjQgNS40IDAgMCAxIDUtMy43eiIgZmlsbD0iI0VBNDMzNSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PHBhdGggZD0iTTAgMGgxOHYxOEgweiIvPjwvZz48L3N2Zz4="
                  }
                  style={{ marginRight: "8px" }}
                  alt="signup_with_google"
                />
                Sign in with Google
              </button>
            </div>
          </div>
          <div className={classes.img}>
            <img src={theme.assets.signUp} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
