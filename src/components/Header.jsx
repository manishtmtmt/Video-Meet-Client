import { Box, Button, Grid, Modal, Typography } from "@mui/material";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import logo from "../Assets/utilImages/video.png";
import userImage from "../Assets/utilImages/userImage.jpeg";
import vectorImg from "../Assets/utilImages/Vector.svg";
import vectorII from "../Assets/utilImages/vector_1.svg";
import { logout } from "../redux/slice/authSlice";

let interval;

export const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [time, setTime] = useState("");
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const {
    data: { userType, username },
  } = useSelector((state) => state.authReducer);

  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    const date = moment().format("MMMM Do, YYYY | hh:mm A");
    setTime(date);
    interval = setInterval(() => {
      const date = moment().format("MMMM Do, YYYY | hh:mm A");
      setTime(date);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);
  return (
    <Grid
      container
      alignItems={"center"}
      spacing={2}
      justifyContent={"space-between"}
      sx={{ background: "#fff" }}
    >
      <Grid item xs={3}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <Box sx={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            <img src={logo} alt="logo" />
          </Box>
          <Box>
            <img src={vectorII} alt="vector" />
          </Box>
          <Box>
            <Typography
              color={"#acacac"}
              fontSize={"18px"}
              fontFamily={"500 14px Inter, sans-serif"}
            >
              {time}
            </Typography>
          </Box>
        </Box>
      </Grid>
      <Grid
        item
        xs={3}
        sx={{
          marginRight: "30px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Box
          sx={{
            width: "60%",
            display: "flex",
            backgroundColor: "#f6f6f6;",
            alignItems: "center",
            borderRadius: "80px",
            justifyContent: "space-between",
            padding: "12px 20px",
            position: "relative",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Box
              sx={{
                height: "60px",
                width: "60px",
                borderRadius: "27px",
                border: "3px solid #fff",
              }}
            >
              <img
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                src={userImage}
                alt="user"
              />
            </Box>
            <Box>
              <Typography>{username ? username : "Person"}</Typography>
              <Typography>
                {userType === "teacher" ? "Teacher" : "Student"}
              </Typography>
            </Box>
          </Box>
          <Box
            style={{ paddingRight: "20px", cursor: "pointer" }}
            onClick={handleOpen}
          >
            <img src={vectorImg} alt="vector" />
          </Box>
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box
              sx={{
                position: "absolute",
                width: "200px",
                top: "10%",
                right: "20px",
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "10px",
              }}
            >
              <Typography fontSize={"18px"} mb={2}>
                {username}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          </Modal>
        </Box>
      </Grid>
    </Grid>
  );
};
