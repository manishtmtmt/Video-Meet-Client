import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { generateUniqueID, getInitials } from "../utils";
import { useNavigate } from "react-router-dom";
import validator from "validator";
import { Header } from "../components/Header";
import { useSelector } from "react-redux";

export const CreateRoom = ({ socketRef }) => {
  const {
    data: { username: name },
  } = useSelector((state) => state.authReducer);
  const navigate = useNavigate();
  const [roomID, setRoomID] = useState(generateUniqueID(4));
  const [snackOpen, setSnackOpen] = useState(false);
  const [username, setUsername] = useState(name);
  const [useVideo, setUseVideo] = useState(true);
  const [useAudio, setUseAudio] = useState(false);
  const [errors, setErrors] = useState({});
  const [language, setLanguage] = useState("");

  const localVideoRef = useRef();
  const webCamStreamRef = useRef();
  const audioRef = useRef();

  const handleVideoState = () => {
    if (useVideo && webCamStreamRef.current) {
      webCamStreamRef.current.getVideoTracks().forEach((track) => track.stop());
    } else {
      startWebCam();
    }
    setUseVideo((prev) => !prev);
  };

  const handleAudioState = () => {
    audioRef.current.volume = useAudio ? 1 : 0;
    setUseAudio(!useAudio);
  };

  const handleClick = () => {
    setSnackOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackOpen(false);
  };

  const handleJoinRoom = () => {
    let newErrors = {};

    if (!username || validator.isEmpty(username)) {
      newErrors = {
        ...newErrors,
        username: "Username is required.",
      };
    }

    if (!language || validator.isEmpty(language)) {
      newErrors = {
        ...newErrors,
        language: "Please select a language.",
      };
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      navigate(`/room/${roomID}`, {
        state: { username, useVideo, language, useAudio },
      });
    }
  };

  const startWebCam = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        webCamStreamRef.current = stream;
        localVideoRef.current.srcObject = new MediaStream([
          stream.getVideoTracks()[0],
        ]);
        audioRef.current.srcObject = new MediaStream([
          stream.getAudioTracks()[0],
        ]);
      })
      .catch((error) => {
        console.log("ERROR in starting WebCam", error);
      });
  };

  useEffect(() => {
    startWebCam();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.close();
      window.location.reload();
    }
  }, []);

  return (
    <Box sx={{ backgroundColor: "#EAE9E9", height: "100vh" }}>
      <Header />
      <Grid container mt={5} gap={3} justifyContent={"center"}>
        <Grid item position={"relative"} xs={4} height={"450px"}>
          {useVideo ? (
            <Box sx={{ height: "100%" }}>
              <video
                playsInline
                ref={localVideoRef}
                autoPlay
                width={"100%"}
                height={"100%"}
                style={{ objectFit: "cover", borderRadius: "20px" }}
                muted
              ></video>
            </Box>
          ) : (
            <Box
              width={"100%"}
              height={"100%"}
              sx={{
                background: "#000",
                objectFit: "fill",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                color={"#fff"}
                variant="h3"
                fontWeight={"bold"}
                width={"150px"}
                height={"150px"}
                sx={{
                  borderRadius: "50%",
                  background: "gray",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {username ? getInitials(username) : "You"}
              </Typography>
            </Box>
          )}
          <audio ref={audioRef} autoPlay muted></audio>
          <Grid
            container
            position={"absolute"}
            bottom={"8%"}
            justifyContent={"center"}
            gap={3}
          >
            <Grid item>
              <span onClick={handleAudioState} style={{ cursor: "pointer" }}>
                {useAudio ? (
                  <Box
                    borderRadius={"50%"}
                    sx={{
                      color: "white",
                      width: "50px",
                      height: "50px",
                      background: "red",
                      fontSize: "32px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MicOffIcon />
                  </Box>
                ) : (
                  <Box
                    borderRadius={"50%"}
                    sx={{
                      color: "white",
                      width: "50px",
                      height: "50px",
                      background: "blue",
                      fontSize: "32px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MicIcon />
                  </Box>
                )}
              </span>
            </Grid>
            <Grid item>
              <span style={{ cursor: "pointer" }} onClick={handleVideoState}>
                {useVideo ? (
                  <Box
                    borderRadius={"50%"}
                    sx={{
                      color: "white",
                      width: "50px",
                      height: "50px",
                      background: "blue",
                      fontSize: "32px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <VideocamIcon />
                  </Box>
                ) : (
                  <Box
                    borderRadius={"50%"}
                    sx={{
                      color: "white",
                      width: "50px",
                      height: "50px",
                      background: "red",
                      fontSize: "32px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <VideocamOffIcon />
                  </Box>
                )}
              </span>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          item
          p={2}
          xs={4}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignSelf: "center",
            justifyContent: "center",
            gap: "15px",
          }}
        >
          <Box>
            <Typography variant="h5">Enter username:</Typography>
            <TextField
              id="outlined-basic"
              label="Username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username && (
              <p style={{ color: "red", padding: "5px 0" }}>
                {errors.username}
              </p>
            )}
          </Box>
          <Box>
            <Typography variant="h6">Select Your Language:</Typography>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">
                Select Language
              </InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                label="Select Language"
                onChange={(e) => setLanguage(e.target.value)}
              >
                <MenuItem value={"en"}>English</MenuItem>
                <MenuItem value={"si"}>Sinhala</MenuItem>
                {/* <MenuItem value={"fra"}>French</MenuItem> */}
                {/* <MenuItem value={"aka"}>Akan</MenuItem> */}
                {/* <MenuItem value={"ben"}>Bengali</MenuItem> */}
                {/* <MenuItem value={"kaz"}>Kazakh</MenuItem> */}
                {/* <MenuItem value={"mya"}>Burmese</MenuItem> */}
                {/* <MenuItem value={"swh"}>Swahili</MenuItem> */}
                <MenuItem value={"ru"}>Russian</MenuItem>
                <MenuItem value={"te"}>Telugu</MenuItem>
                <MenuItem value={"vi"}>Vietnam</MenuItem>
              </Select>
            </FormControl>
            {errors.language && (
              <p style={{ color: "red", padding: "5px 0" }}>
                {errors.language}
              </p>
            )}
          </Box>
          <Box>
            <Button variant="contained" fullWidth onClick={handleJoinRoom}>
              Join Room
            </Button>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            p={2}
            border={"1px solid"}
          >
            <Typography fontSize={"18px"}>Room ID: {roomID}</Typography>
            <CopyToClipboard
              text={roomID}
              style={{
                cursor: "pointer",
                marginLeft: "10px",
              }}
            >
              <ContentCopyIcon onClick={handleClick} />
            </CopyToClipboard>
          </Box>
        </Grid>
      </Grid>
      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
          Room Code Copied Successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};
