import { Box, Button, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Header } from "../components/Header";
import hello from "../Assets/utilImages/Hello.svg";
import amico from "../Assets/utilImages/amico.png";
import clock from "../Assets/utilImages/clock.svg";
import { useNavigate } from "react-router-dom";

export const StudentHome = () => {
  const navigate = useNavigate();
  const {
    data: { username },
  } = useSelector((state) => state.authReducer);
  return (
    <Box sx={{ backgroundColor: "#EAE9E9", height: "100vh" }}>
      <Header />
      <Grid container mt={4} px={4}>
        <Grid
          item
          xs={6}
          p={4}
          sx={{
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            borderRadius: "20px",
          }}
        >
          <Typography variant="h3" fontWeight={"bold"} pl={5}>
            Hi {username}!!
          </Typography>
          <Box>
            <img src={hello} alt="hello" />
          </Box>
        </Grid>
        <Grid item xs={6}></Grid>
      </Grid>
      <Box
        sx={{
          width: "96%",
          margin: "auto",
          marginTop: 5,
          background: "#e5e5e5",
          borderRadius: "20px",
          display: "flex",
          justifyContent: "center",
        }}
        p={5}
      >
        <Grid
          container
          gap={5}
          width={"70%"}
          m={"auto"}
          justifyContent={"space-evenly"}
        >
          <Grid
            item
            xs={5}
            sx={{ background: "#fff", borderRadius: "20px" }}
            p={3}
          >
            <Box sx={{ display: "flex" }} mt={1} mb={4}>
              <Typography fontWeight={"bold"} fontSize={"18px"} p={2}>
                New Class Room Session
              </Typography>
              <Box height={"220px"}>
                <img
                  style={{ width: "100%", height: "100%" }}
                  src={amico}
                  alt="amico"
                />
              </Box>
            </Box>
            <Box>
              <Button
                sx={{
                  fontWeight: "700",
                  textTransform: "none",
                  letterSpacing: ".1rem",
                  fontSize: "1.1rem",
                }}
                variant="contained"
                fullWidth
                onClick={() => navigate("/join")}
              >
                Start
              </Button>
            </Box>
          </Grid>
          <Grid
            item
            xs={5}
            sx={{ background: "#fff", borderRadius: "20px" }}
            p={3}
          >
            <Box sx={{ display: "flex" }} mt={1} mb={4}>
              <Typography fontWeight={"bold"} fontSize={"18px"} p={2}>
                Previous Session
              </Typography>
              <Box height={"220px"}>
                <img
                  style={{ width: "100%", height: "100%" }}
                  src={clock}
                  alt="clock"
                />
              </Box>
            </Box>
            <Box>
              <Button
                sx={{
                  fontWeight: "700",
                  textTransform: "none",
                  letterSpacing: ".1rem",
                  fontSize: "1.1rem",
                }}
                variant="contained"
                fullWidth
              >
                Start
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
