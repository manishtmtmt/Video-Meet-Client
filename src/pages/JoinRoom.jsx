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
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import validator from "validator";
import { useSelector } from "react-redux";

export const JoinRoom = ({ socketRef }) => {
  const {
    data: { username: name },
  } = useSelector((state) => state.authReducer);
  const navigate = useNavigate();
  const [roomID, setRoomID] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);
  const [username, setUsername] = useState(name);
  const [stream, setStream] = useState();
  const [showVideo, setShowVideo] = useState(false);
  const [muteAudio, setMuteAudio] = useState(false);
  const [errors, setErrors] = useState({});
  const [language, setLanguage] = useState("");

  const localVideoRef = useRef();

  const handleVideoState = () => {
    stream.getTracks()[1].enabled = showVideo;
    setShowVideo(!showVideo);
  };

  const handleAudioState = () => {
    stream.getTracks()[0].enabled = muteAudio;
    setMuteAudio(!muteAudio);
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

    if (!roomID || validator.isEmpty(roomID)) {
      newErrors = {
        ...newErrors,
        roomId: "Room ID is required",
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
      navigate(`/room/${roomID}`, { state: { username } });
    }
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((currentStream) => {
        setStream(currentStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = currentStream;
        }
      });
  }, [setStream]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.close();
      window.location.reload();
    }
  }, []);

  return (
    <Box>
      <Header />
      <Grid container mt={5} gap={3} justifyContent={"center"}>
        <Grid item position={"relative"} xs={4}>
          <video
            playsInline
            ref={localVideoRef}
            autoPlay
            width={"100%"}
            height={"100%"}
          ></video>
          <Grid
            container
            position={"absolute"}
            bottom={"8%"}
            justifyContent={"center"}
            gap={3}
          >
            <Grid item>
              <span onClick={handleAudioState} style={{ cursor: "pointer" }}>
                {muteAudio ? (
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
                {showVideo ? (
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
                    <VideocamIcon />
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
            <Typography variant="h6">Enter username:</Typography>
            <TextField
              id="outlined-basic"
              label="Username..."
              variant="outlined"
              fullWidth
              onChange={(e) => setUsername(e.target.value)}
              value={username}
            />
            {errors.username && (
              <p style={{ color: "red", padding: "5px 0" }}>
                {errors.username}
              </p>
            )}
          </Box>
          <Box>
            <Typography variant="h6">Enter Room ID:</Typography>
            <TextField
              id="outlined-basic"
              label="Room ID..."
              variant="outlined"
              fullWidth
              onChange={(e) => setRoomID(e.target.value)}
            />
            {errors.roomId && (
              <p style={{ color: "red", padding: "5px 0" }}>{errors.roomId}</p>
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
                <MenuItem value={"fra"}>French</MenuItem>
                <MenuItem value={"aka"}>Akan</MenuItem>
                <MenuItem value={"ben"}>Bengali</MenuItem>
                <MenuItem value={"kaz"}>Kazakh</MenuItem>
                <MenuItem value={"mya"}>Burmese</MenuItem>
                <MenuItem value={"swh"}>Swahili</MenuItem>
                <MenuItem value={"rus"}>Russian</MenuItem>
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
