import React, { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import { io as socketIOClient } from "socket.io-client";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  InputBase,
  Paper,
  Typography,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TranslateIcon from "@mui/icons-material/Translate";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import ClosedCaptionIcon from "@mui/icons-material/ClosedCaption";
import ClosedCaptionDisabledIcon from "@mui/icons-material/ClosedCaptionDisabled";
import { RemoteVideos } from "../components/RemoteVideos";
import { useDispatch, useSelector } from "react-redux";
import AudioReactRecorder, { RecordState } from "audio-react-recorder";
import axios from "axios";
import { logout } from "../redux/slice/authSlice";
import moment from "moment";

const MODE_STREAM = "stream";
const MODE_SHARE_SCREEN = "share_screen";
const uploadAPIURL = "http://localhost:5000/save-record";
let interval = null;

const RenderLocalVideo = ({ playVideo, localStream, peerName }) => {
  const localVideo = useRef();
  const videoTrack = localStream.current?.getVideoTracks()[0];

  const videoEnabled = videoTrack?.enabled;

  useEffect(() => {
    playVideo(localVideo.current, localStream.current);
  }, [localStream, playVideo]);
  return (
    <>
      <video
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "15px",
        }}
        autoPlay
        ref={localVideo}
      ></video>
      {!videoEnabled ? (
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
          position={"absolute"}
          top={0}
        >
          <Typography
            color={"#fff"}
            variant="h3"
            fontWeight={"bold"}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {peerName}
          </Typography>
        </Box>
      ) : null}
    </>
  );
};

export const Room = ({ socketRef }) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();

  const localScreen = useRef();
  const localStreamScreen = useRef();
  const localVideo = useRef();
  const localStream = useRef();
  const clientId = useRef();
  const device = useRef();
  const producerTransport = useRef();
  const videoProducer = useRef({});
  const audioProducer = useRef({});
  const consumerTransport = useRef();
  const videoConsumers = useRef({});
  const audioConsumers = useRef({});
  const consumersStream = useRef({});
  const messagesEndRef = useRef(null);
  const socketPyRef = useRef();
  const chatInputRef = useRef();

  const [pySocketId, setPySocketId] = useState("");
  const [useVideo, setUseVideo] = useState(true);
  const [useAudio, setUseAudio] = useState(true);
  const [isStartMedia, setIsStartMedia] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteVideos, setRemoteVideos] = useState({});
  const [recAudio, setRecAudio] = useState(false);
  const [recordState, setRecordState] = useState(null);
  const [isShareScreen, setIsShareScreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState();
  const [messages, setMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewCaption, setViewCaption] = useState(false);
  const [caption, setCaption] = useState("");

  const itemsPerPage = 4;
  const totalPages = Math.ceil(Object.keys(remoteVideos).length / itemsPerPage);

  const viewCaptionRef = useRef(viewCaption);
  const messagesRef = useRef(messages);

  useEffect(() => {
    viewCaptionRef.current = viewCaption;
    messagesRef.current = messages;
  }, [messages, viewCaption]);

  const {
    data: { userType, userId },
  } = useSelector((state) => state.authReducer);
  console.log("🚀 ~ Room ~ userType:", userType);

  const consoleLog = (data) => {
    // console.log(data)
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js";
    script.async = true;

    script.onload = () => {
      // The script has been loaded, and you can now use Socket.IO in your component
      // eslint-disable-next-line no-undef
      socketPyRef.current = io("http://localhost:5000");

      socketPyRef.current.on("connect", (data) => {
        console.log("socketPY data: ", data);
        setPySocketId(data?.sid);
      });

      socketPyRef.current.on("translate_ack", (data) => {
        console.log("Got audio ack");
        socketPyRef.current.emit("request_audio");
      });

      socketPyRef.current.on("play_audio", (data) => {
        console.log(data);
        const audioData = data.audio_data;
        const translatedText = data.translated_text;
        const name = data.name;
        console.log("🚀 ~ file: Room.jsx:138 ~ Room ~ useAudio:", useAudio);
        playBackgroundAudio(
          audioData,
          translatedText,
          name,
          viewCaptionRef.current
        );
      });

      socketPyRef.current.on("show_translated_msg", (data) => {
        const newChats = Array.from(messagesRef.current);
        console.log(
          "🚀 ~ file: Room.jsx:160 ~ socketPyRef.current.on ~ newChats:",
          newChats
        );
        if (newChats[data.iconid]) {
          newChats[data.iconid].message = data.translated_chat;
          setMessages(newChats);
        }
      });

      socketPyRef.current.on("handshake_done", () => {
        socketPyRef.current.emit("message", {
          message: `Hey id: ${socketPyRef.current.id} just joined`,
          room: roomId,
        });
      });
    };

    document.body.appendChild(script);

    // Clean up the script when the component is unmounted
    return () => {
      document.body.removeChild(script);
    };
  }, []); // Empty dependency array to run the effect only once when the component mounts

  useEffect(() => {
    interval = setInterval(() => {
      if (recAudio) {
        setRecordState(RecordState.STOP);
        setTimeout(() => {
          setRecordState(RecordState.START);
        }, 5);
      } else {
        clearInterval(interval);
      }
    }, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [recAudio]);

  // Make Changes over here for captions and to listen audio
  const playBackgroundAudio = (
    audioData,
    translatedtext,
    name,
    viewCaption
  ) => {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();

    audioContext.decodeAudioData(audioData, function (buffer) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      console.log("inside decode audio");
      source.connect(audioContext.destination);
      if (viewCaption) {
        setCaption({ name, translatedText: translatedtext });
        source.start(0);
      } else {
        source.start(0);
      }
    });
  };

  const onStop = async (audioData) => {
    var file = new File([audioData.blob], "data.wav");
    // Create FormData object to send the file
    const formData = new FormData();
    formData.append("file", file);

    // Make Axios POST request to the Flask endpoint
    await axios
      .post(uploadAPIURL, formData)
      .then((response) => {
        // Handle the response from the server
        console.log("Server response:", response.data);
        socketPyRef.current.emit("translate", response.data);
      })
      .catch((error) => {
        // Handle errors
        console.error("Error:", error);
      });
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // ============ UI button ==========

  const translateMessage = (message, id) => {
    console.log("translateMessage: ", message);
    socketPyRef.current.emit("request_translated_msg", { msg: message, id });
  };

  const handleStartScreenShare = () => {
    if (localStreamScreen.current) {
      console.warn("WARN: local media ALREADY started");
      return;
    }

    const mediaDevices = navigator.mediaDevices;
    mediaDevices
      .getDisplayMedia({ audio: useAudio, video: useVideo })
      .then((stream) => {
        localStreamScreen.current = stream;

        playVideo(localScreen.current, localStreamScreen.current);
        handleConnectScreenShare();
        setIsShareScreen(true);
        const screenTrack = stream.getTracks()[0];
        screenTrack.onended = function () {
          handleDisconnectScreenShare();
        };
      })
      .catch((err) => {
        console.error("media ERROR:", err);
      });
  };

  const handleMuteAudio = () => {
    localStream.current.getTracks()[0].enabled = false;
    setUseAudio(false);
  };

  const handleUnmuteAudio = () => {
    localStream.current.getTracks()[0].enabled = true;
    setUseAudio(true);
  };

  const handleHideVideo = async () => {
    localStream.current.getVideoTracks()[0].enabled = false;
    await sendRequest("webCamStatus", { videoEnabled: false }).catch((err) => {
      console.log("Error ->", err);
    });
    setUseVideo(false);
  };

  const handleShowVideo = async () => {
    localStream.current.getVideoTracks()[0].enabled = true;
    await sendRequest("webCamStatus", { videoEnabled: true }).catch((err) => {
      console.log("Error ->", err);
    });
    setUseVideo(true);
  };

  async function handleConnectScreenShare() {
    if (!localStreamScreen.current) {
      console.warn("WARN: local media NOT READY");
      return;
    }

    // --- get capabilities --
    const data = await sendRequest("getRouterRtpCapabilities", {
      token: userId,
      roomName: roomId,
      peername: location.state.username,
      peerRoleType: userType,
    });
    console.log("getRouterRtpCapabilities:", data);
    await loadDevice(data);

    // --- get transport info ---
    console.log("--- createProducerTransport --");
    const params = await sendRequest("createProducerTransport", {
      mode: MODE_SHARE_SCREEN,
    });
    console.log("transport params:", params);
    producerTransport.current = device.current.createSendTransport(params);
    console.log("createSendTransport:", producerTransport.current);

    // --- join & start publish --
    producerTransport.current.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        console.log("--trasnport connect");
        sendRequest("connectProducerTransport", {
          dtlsParameters: dtlsParameters,
        })
          .then(callback)
          .catch(errback);
      }
    );

    producerTransport.current.on(
      "produce",
      async ({ kind, rtpParameters }, callback, errback) => {
        console.log("--trasnport produce");
        try {
          const { id } = await sendRequest("produce", {
            transportId: producerTransport.current.id,
            kind,
            rtpParameters,
            mode: MODE_SHARE_SCREEN,
          });
          callback({ id });
          console.log("--produce requested, then subscribe ---");
          subscribe();
        } catch (err) {
          errback(err);
        }
      }
    );

    producerTransport.current.on("connectionstatechange", (state) => {
      switch (state) {
        case "connecting":
          console.log("publishing...");
          break;

        case "connected":
          console.log("published");
          //  setIsConnected(true);
          break;

        case "failed":
          console.log("failed");
          producerTransport.current.close();
          break;

        default:
          break;
      }
    });

    if (useVideo) {
      const videoTrack = localStreamScreen.current.getVideoTracks()[0];
      if (videoTrack) {
        const trackParams = { track: videoTrack };
        videoProducer.current[MODE_SHARE_SCREEN] =
          await producerTransport.current.produce(trackParams);
      }
    }
    if (useAudio) {
      const audioTrack = localStreamScreen.current.getAudioTracks()[0];
      if (audioTrack) {
        const trackParams = { track: audioTrack };
        audioProducer.current[MODE_SHARE_SCREEN] =
          await producerTransport.current.produce(trackParams);
      }
    }
  }

  function handleStopScreenShare() {
    if (localStreamScreen.current) {
      pauseVideo(localScreen.current);
      stopLocalStream(localStreamScreen.current);
      localStreamScreen.current = null;
      setIsShareScreen(false);
    }
  }

  async function handleDisconnectScreenShare() {
    handleStopScreenShare();
    {
      const producer = videoProducer.current[MODE_SHARE_SCREEN];
      producer?.close();
      delete videoProducer.current[MODE_SHARE_SCREEN];
    }
    {
      const producer = audioProducer.current[MODE_SHARE_SCREEN];
      producer?.close();
      delete audioProducer.current[MODE_SHARE_SCREEN];
    }

    await sendRequest("producerStopShareScreen", {});
  }

  const handleStartMedia = () => {
    if (localStream.current) {
      console.warn("WARN: local media ALREADY started");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: useAudio, video: useVideo })
      .then((stream) => {
        localStream.current = stream;
        setIsStartMedia(true);
      })
      .catch((err) => {
        console.error("local video: media ERROR:", err);
      });
  };

  function handleStopMedia() {
    if (localStream.current) {
      pauseVideo(localVideo.current);
      stopLocalStream(localStream.current);
      localStream.current = null;
      setIsStartMedia(false);
    }
  }

  function handleDisconnect() {
    handleStopMedia();
    handleStopScreenShare();
    // if (videoProducer.current) {
    //     videoProducer.current.close(); // localStream will stop
    //     videoProducer.current = null;
    // }

    for (const mode in videoProducer.current) {
      const producer = videoProducer.current[mode];
      producer?.close();
      delete videoProducer.current[mode];
    }

    for (const mode in audioProducer.current) {
      const producer = audioProducer.current[mode];
      producer?.close();
      delete audioProducer.current[mode];
    }

    // if (audioProducer.current) {
    //     audioProducer.current.close(); // localStream will stop
    //     audioProducer.current = null;
    // }
    if (producerTransport.current) {
      producerTransport.current.close(); // localStream will stop
      producerTransport.current = null;
    }

    for (const key in videoConsumers.current) {
      for (const key2 in videoConsumers.current[key]) {
        const consumer = videoConsumers.current[key][key2];
        consumer.close();
        delete videoConsumers.current[key][key2];
      }
    }
    for (const key in audioConsumers.current) {
      for (const key2 in audioConsumers.current[key]) {
        const consumer = audioConsumers.current[key][key2];
        consumer.close();
        delete audioConsumers.current[key][key2];
      }
    }

    if (consumersStream.current) {
      consumersStream.current = {};
    }

    if (consumerTransport.current) {
      consumerTransport.current.close();
      consumerTransport.current = null;
    }

    removeAllRemoteVideo();

    disconnectSocket();
    setIsConnected(false);
  }

  function playVideo(element, stream) {
    if (element.srcObject) {
      console.warn("element ALREADY playing, so ignore");
      return;
    }

    element.srcObject = stream;
    element.volume = 0;
    return element.play();
  }

  function pauseVideo(element) {
    if (element) {
      element.pause();
      element.srcObject = null;
    }
  }

  function stopLocalStream(stream) {
    let tracks = stream.getTracks();
    if (!tracks) {
      console.warn("NO tracks");
      return;
    }

    tracks.forEach((track) => track.stop());
  }

  function addRemoteTrack(id, track, mode, remotePeerName, remotePeerRoleType) {
    // let video = findRemoteVideo(id);
    // if (!video) {
    //     video = addRemoteVideo(id);
    //     video.controls = '1';
    // }

    // if (video.srcObject) {
    //     video.srcObject.addTrack(track);
    //     return;
    // }

    if (id === clientId.current) {
      return false;
    }

    console.log("addremotetrack");
    console.log(track);

    if (consumersStream.current[id] === undefined) {
      consumersStream.current[id] = {};
    }

    if (consumersStream.current[id][mode] === undefined) {
      const newStream = new MediaStream();
      newStream.addTrack(track);
      consumersStream.current[id][mode] = {
        stream: newStream,
        socket_id: id,
        peerName: remotePeerName,
        peerRoleType: remotePeerRoleType,
        videoEnabled: useVideo,
      };
    } else {
      //add audiotrack
      consumersStream.current[id][mode].stream.addTrack(track);
    }

    setRemoteVideos((peers) => {
      const newPeers = peers;

      return { ...consumersStream.current };
    });
  }

  function addRemoteVideo(id) {
    let existElement = findRemoteVideo(id);
    if (existElement) {
      console.warn("remoteVideo element ALREADY exist for id=" + id);
      return existElement;
    }

    let element = document.createElement("video");
    return element;
  }

  function findRemoteVideo(id) {
    let element = remoteVideos.current[id];
    return element;
  }

  function removeRemoteVideo(id, mode) {
    console.log(" ---- removeRemoteVideo() id=" + id);
    if (mode === MODE_STREAM) {
      delete consumersStream.current[id];
    } else {
      delete consumersStream.current[id][mode];
    }

    setRemoteVideos((peers) => {
      const newPeers = peers;
      delete newPeers[id];

      return { ...consumersStream.current };
    });
  }

  function removeAllRemoteVideo() {
    console.log(" ---- removeAllRemoteVideo() id");
    consumersStream.current = {};
    setRemoteVideos((peers) => {
      const newPeers = {};

      return { ...newPeers };
    });
    // while (remoteContainer.firstChild) {
    //     remoteContainer.firstChild.pause();
    //     remoteContainer.firstChild.srcObject = null;
    //     remoteContainer.removeChild(remoteContainer.firstChild);
    // }
  }

  async function consumeAdd(
    transport,
    remoteSocketId,
    prdId,
    trackKind,
    mode = MODE_STREAM
  ) {
    console.log("--start of consumeAdd -- kind=%s", trackKind);
    const { rtpCapabilities } = device.current;
    //const data = await socket.request('consume', { rtpCapabilities });
    const data = await sendRequest("consumeAdd", {
      rtpCapabilities: rtpCapabilities,
      remoteId: remoteSocketId,
      kind: trackKind,
      mode: mode,
    }).catch((err) => {
      console.error("consumeAdd ERROR:", err);
    });
    const { producerId, id, kind, rtpParameters } = data.params;
    if (prdId && prdId !== producerId) {
      console.warn("producerID NOT MATCH");
    }

    let codecOptions = {};
    const consumer = await transport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
      codecOptions,
      mode,
    });
    //const stream = new MediaStream();
    //stream.addTrack(consumer.track);
    addConsumer(remoteSocketId, consumer, kind, mode);
    consumer.remoteId = remoteSocketId;
    consumer.on("transportclose", () => {
      console.log("--consumer transport closed. remoteId=" + consumer.remoteId);
      //consumer.close();
      //removeConsumer(remoteId);
      //removeRemoteVideo(consumer.remoteId);
    });
    consumer.on("producerclose", () => {
      console.log("--consumer producer closed. remoteId=" + consumer.remoteId);
      consumer.close();
      removeConsumer(consumer.remoteId, kind, mode);
      removeRemoteVideo(consumer.remoteId, mode);
    });
    consumer.on("trackended", () => {
      console.log("--consumer trackended. remoteId=" + consumer.remoteId);
      //consumer.close();
      //removeConsumer(remoteId);
      //removeRemoteVideo(consumer.remoteId);
    });

    console.log("--end of consumeAdd");
    //return stream;

    if (kind === "video") {
      console.log("--try resumeAdd --");
      sendRequest("resumeAdd", {
        remoteId: remoteSocketId,
        kind: kind,
        mode,
      })
        .then(() => {
          console.log("resumeAdd OK");
        })
        .catch((err) => {
          console.error("resumeAdd ERROR:", err);
        });
    }
    return new Promise((resolve, reject) => {
      addRemoteTrack(
        remoteSocketId,
        consumer.track,
        mode,
        data.remotePeerName,
        data.remotePeerRoleType
      );
      resolve();
    });
  }

  const handleConnect = async () => {
    console.log("handle connect function called");
    if (!localStream.current) {
      console.warn("WARN: local media NOT READY");
      return;
    }

    // --- connect socket.io ---
    await connectSocket().catch((err) => {
      console.error(err);
      return;
    });

    console.log("socket connected");

    try {
      console.log({
        token: userId,
        roomName: roomId,
        peername: location.state.username,
        peerRoleType: userType,
      });
      // --- get capabilities --
      const data = await sendRequest("getRouterRtpCapabilities", {
        token: userId,
        roomName: roomId,
        peername: location.state.username,
        peerRoleType: userType,
        peerLanguage: location.state.language,
      });
      console.log("getRouterRtpCapabilities:", data);
      await loadDevice(data);
    } catch (error) {
      console.log(
        "🚀 ~ handleConnect ~ error:",
        JSON.parse(error),
        typeof error
      );
      alert(JSON.parse(error).text);
      dispatch(logout());
      return;
    }

    // --- get transport info ---
    console.log("--- createProducerTransport --");
    const params = await sendRequest("createProducerTransport", {
      mode: MODE_STREAM,
    });
    console.log("transport params:", params);
    producerTransport.current = device.current.createSendTransport(params);
    console.log("createSendTransport:", producerTransport.current);

    // --- join & start publish --
    producerTransport.current.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        console.log("--trasnport connect");
        sendRequest("connectProducerTransport", {
          dtlsParameters: dtlsParameters,
        })
          .then(callback)
          .catch(errback);
      }
    );

    producerTransport.current.on(
      "produce",
      async ({ kind, rtpParameters }, callback, errback) => {
        console.log("--trasnport produce");
        try {
          const { id } = await sendRequest("produce", {
            transportId: producerTransport.current.id,
            kind,
            rtpParameters,
            mode: MODE_STREAM,
          });
          callback({ id });
          console.log("--produce requested, then subscribe ---");
          subscribe();
        } catch (err) {
          errback(err);
        }
      }
    );

    producerTransport.current.on("connectionstatechange", (state) => {
      switch (state) {
        case "connecting":
          console.log("publishing...");
          break;

        case "connected":
          console.log("published");
          setIsConnected(true);
          break;

        case "failed":
          console.log("failed");
          producerTransport.current.close();
          break;

        default:
          break;
      }
    });

    if (useVideo) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        const trackParams = { track: videoTrack };
        videoProducer.current[MODE_STREAM] =
          await producerTransport.current.produce(trackParams);
      }
    }

    if (useAudio) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        const trackParams = { track: audioTrack };
        audioProducer.current[MODE_STREAM] =
          await producerTransport.current.produce(trackParams);
      }
    }
  };

  async function subscribe() {
    // consoleLog(socketRef.current);
    if (!socketRef.current) {
      await connectSocket().catch((err) => {
        console.error(err);
        return;
      });
    }

    // --- get capabilities --
    try {
      const data = await sendRequest("getRouterRtpCapabilities", {
        token: userId,
        roomName: roomId,
        peername: location.state.username,
        peerRoleType: userType,
        peerLanguage: location.state.language,
      });

      console.log("getRouterRtpCapabilities:", data);
      await loadDevice(data);
    } catch (error) {
      console.log("🚀 ~ subscribe ~ error:", error);
      alert("Something went Wrong!");
      return;
    }

    //  }

    // --- prepare transport ---
    console.log("--- createConsumerTransport --");
    if (!consumerTransport.current) {
      const params = await sendRequest("createConsumerTransport", {});
      console.log("transport params:", params);
      consumerTransport.current = device.current.createRecvTransport(params);
      console.log("createConsumerTransport:", consumerTransport.current);

      // --- join & start publish --
      consumerTransport.current.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          console.log("--consumer trasnport connect");
          sendRequest("connectConsumerTransport", {
            dtlsParameters: dtlsParameters,
          })
            .then(callback)
            .catch(errback);
        }
      );

      consumerTransport.current.on("connectionstatechange", (state) => {
        switch (state) {
          case "connecting":
            console.log("subscribing...");
            break;

          case "connected":
            console.log("subscribed");
            //consumeCurrentProducers(clientId);
            break;

          case "failed":
            console.log("failed");
            producerTransport.current.close();
            break;

          default:
            break;
        }
      });

      consumeCurrentProducers(clientId.current);
    }
  }

  async function loadDevice(routerRtpCapabilities) {
    try {
      device.current = new Device();
    } catch (error) {
      if (error.name === "UnsupportedError") {
        console.error("browser not supported");
      }
    }
    await device.current.load({ routerRtpCapabilities });
  }

  function sendRequest(type, data) {
    return new Promise((resolve, reject) => {
      socketRef.current.emit(type, data, (err, response) => {
        if (!err) {
          // Success response, so pass the mediasoup response to the local Room.
          resolve(response);
        } else {
          console.log(`🚀 ~ socketRef.current.emit ~ err: ${err}`);
          reject(err);
        }
      });
    });
  }

  async function consumeCurrentProducers(clientId) {
    console.log("-- try consuleAll() --");
    const remoteInfo = await sendRequest("getCurrentProducers", {
      localId: clientId.current,
    }).catch((err) => {
      console.error("getCurrentProducers ERROR:", err);
      return;
    });
    //console.log('remoteInfo.producerIds:', remoteInfo.producerIds);
    console.log("remoteInfo.remoteVideoIds:", remoteInfo.remoteVideoIds);
    console.log("remoteInfo.remoteAudioIds:", remoteInfo.remoteAudioIds);
    consumeAll(
      consumerTransport.current,
      remoteInfo.remoteVideoIds,
      remoteInfo.remoteAudioIds
    );
  }

  function consumeAll(transport, remoteVideoIds, remotAudioIds) {
    console.log("----- consumeAll() -----");

    remoteVideoIds.forEach((rId) => {
      consumeAdd(transport, rId, null, "video", MODE_STREAM).then((resp) => {
        consumeAdd(transport, rId, null, "video", MODE_SHARE_SCREEN);
      });
    });
    let audioIdsCount = 0;
    remotAudioIds.forEach((rId) => {
      consumeAdd(transport, rId, null, "audio", MODE_STREAM).then((resp) => {
        consumeAdd(transport, rId, null, "audio", MODE_SHARE_SCREEN);
      });
    });
  }

  function disconnectSocket() {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      clientId.current = null;
      console.log("socket.io closed..");
    }
  }

  function removeConsumer(id, kind, mode) {
    if (mode == undefined) {
      return false;
    }
    if (kind === "video") {
      if (mode == MODE_STREAM) {
        delete videoConsumers.current[id];
      } else {
        delete videoConsumers.current[id][mode];
      }

      console.log(
        "videoConsumers count=" + Object.keys(videoConsumers.current).length
      );
    } else if (kind === "audio") {
      if (mode == MODE_STREAM) {
        delete audioConsumers.current[id];
      } else {
        delete audioConsumers.current[id][mode];
      }

      console.log(
        "audioConsumers count=" + Object.keys(audioConsumers.current).length
      );
    } else {
      console.warn("UNKNOWN consumer kind=" + kind);
    }
  }

  function addConsumer(id, consumer, kind, mode) {
    if (id === clientId.current) {
      return false;
    }
    if (kind === "video") {
      if (videoConsumers.current[id] == undefined) {
        videoConsumers.current[id] = {};
      }
      videoConsumers.current[id][mode] = consumer;
      console.log(
        "videoConsumers count=" + Object.keys(videoConsumers.current).length
      );
    } else if (kind === "audio") {
      if (audioConsumers.current[id] == undefined) {
        audioConsumers.current[id] = {};
      }
      audioConsumers.current[id][mode] = consumer;

      consoleLog(
        "audioConsumers count=" + Object.keys(audioConsumers.current).length
      );
    } else {
      console.warn("UNKNOWN consumer kind=" + kind);
    }
  }

  const connectSocket = () => {
    if (!socketRef.current) {
      console.log("socketRef.current", socketRef.current);
      const io = socketIOClient("http://localhost:8000/video-conference");
      socketRef.current = io;
    }

    return new Promise((resolve, reject) => {
      const socket = socketRef.current;

      socket.on("connect", function (evt) {
        console.log("socket.io connected()");
      });
      socket.on("error", function (err) {
        console.error("socket.io ERROR:", err);
        reject(err);
      });
      socket.on("message", function (message) {
        console.log("socket.io message:", message);
        if (message.type === "welcome") {
          if (socket.id !== message.id) {
            console.warn(
              "WARN: something wrong with clientID",
              socket.io,
              message.id
            );
          }

          clientId.current = message.id;
          console.log("connected to server. clientId=" + clientId.current);
          resolve();
        } else {
          console.error("UNKNOWN message from server:", message);
        }
      });
      socket.on("newProducer", function (message) {
        console.log("socket.io newProducer:", message);
        const remoteId = message.socketId;
        const prdId = message.producerId;
        const kind = message.kind;
        const mode = message.mode;

        if (kind === "video") {
          console.log(
            "--try consumeAdd remoteId=" +
              remoteId +
              ", prdId=" +
              prdId +
              ", kind=" +
              kind
          );
          consumeAdd(consumerTransport.current, remoteId, prdId, kind, mode);
        } else if (kind === "audio") {
          //console.warn('-- audio NOT SUPPORTED YET. skip remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
          console.log(
            "--try consumeAdd remoteId=" +
              remoteId +
              ", prdId=" +
              prdId +
              ", kind=" +
              kind
          );
          consumeAdd(consumerTransport.current, remoteId, prdId, kind, mode);
        }
      });

      socket.on("producerClosed", function (message) {
        console.log("socket.io producerClosed:", message);
        const localId = message.localId;
        const remoteId = message.remoteId;
        const kind = message.kind;
        const mode = message.mode;
        console.log(
          "--try removeConsumer remoteId=%s, localId=%s, track=%s",
          remoteId,
          localId,
          kind
        );
        removeConsumer(remoteId, kind, mode);
        removeRemoteVideo(remoteId, mode);
      });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      console.log("EMPTY MESSAGE!");
      setMessage("");
      return;
    }

    const time = new Date().toUTCString();

    await sendRequest("message", { message, time }).catch((err) => {
      console.log("Error ->", err);
    });
    setMessage("");
  };

  function stringToColor(string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";

    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
  }

  function stringAvatar(name) {
    return {
      sx: {
        bgcolor: stringToColor(name),
      },
      children: `${name.split(" ")[0][0]}`,
    };
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    handleStartMedia();

    return () => {
      handleDisconnect();
    };
  }, []);

  useEffect(() => {
    if (isStartMedia) {
      handleConnect();

      socketRef.current.on("chat", function (msg) {
        setMessages([...messages, msg]);
      });

      socketRef.current.on("handshake", (socket) => {
        console.log("socket: handshake", socket);

        socketPyRef.current.emit("handshake", socket);

        socketPyRef.current.on("echo", (data) => {
          console.log("socketRef echo data:", data);
        });
      });

      socketRef.current.on("webCamStatus", (data) => {
        if (remoteVideos.hasOwnProperty(data.remoteSocketId)) {
          setRemoteVideos({
            ...remoteVideos,
            [data.remoteSocketId]: {
              ...remoteVideos[data.remoteSocketId],
              stream: {
                ...remoteVideos[data.remoteSocketId].stream,
                videoEnabled: data.videoEnabled,
              },
            },
          });
          console.log(remoteVideos, "remoteVideos");
        }
      });
    }
  }, [isStartMedia, messages, remoteVideos]);

  return (
    <Box position={"relative"}>
      <Box height={"90vh"} sx={{ display: "flex" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "90%",
            height: "100%",
            position: "relative",
          }}
        >
          {console.log(
            "remote videos length",
            Object.keys(remoteVideos).length
          )}
          {Object.keys(remoteVideos).length === 0 ? (
            <Box width={"80%"} height={"80%"} position={"relative"}>
              <RenderLocalVideo
                playVideo={playVideo}
                localStream={localStream}
                peerName={location.state?.username}
              />
              {useVideo ? (
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: 4,
                    right: 6,
                    padding: "5px",
                    color: "#fff",
                    backgroundColor: "#0f0f0f",
                  }}
                >
                  {location.state?.username} (You)
                </Typography>
              ) : null}
            </Box>
          ) : (
            <Box width={"100%"} height={"90%"}>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <RemoteVideos
                  remoteVideos={remoteVideos}
                  playVideo={playVideo}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box
                  sx={{
                    width: "400px",
                    height: "250px",
                    position: "absolute",
                    left: 5,
                    bottom: 5,
                  }}
                >
                  {console.log("localvideo stream: -->", localVideo.current)}
                  <RenderLocalVideo
                    playVideo={playVideo}
                    localStream={localStream}
                    peerName={location.state.username}
                  />
                  {useVideo ? (
                    <Typography
                      sx={{
                        position: "absolute",
                        bottom: 3,
                        padding: "5px",
                        color: "#fff",
                        backgroundColor: "#0f0f0f",
                      }}
                    >
                      {location.state?.username} (You)
                    </Typography>
                  ) : null}
                </Box>
                {totalPages > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      justifyContent: "flex-end",
                      alignItems: "center",
                      marginBottom: "7px",
                      width: "100%",
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={prevPage}
                      disabled={currentPage === 0}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="contained"
                      onClick={nextPage}
                      disabled={currentPage === totalPages - 1}
                    >
                      Next
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          {console.log(
            "1329: viewCaption",
            viewCaption,
            "translatedText:",
            caption?.translatedText
          )}
          {viewCaption && caption?.translatedText ? (
            <Box sx={{ position: "absolute", bottom: 0, width: "100%" }}>
              <Typography
                sx={{
                  width: "fit-content",
                  margin: "auto",
                  background: "#000",
                  textAlign: "center",
                  color: "#fff",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontWeight: "bold" }}>{caption?.name}: </span>
                {caption.translatedText}
              </Typography>
            </Box>
          ) : null}
        </Box>
        {showChat && (
          <Box
            sx={{
              width: "20%",
              border: "1px solid",
              position: "relative",
              borderBottom: "none",
            }}
          >
            <Box sx={{ height: "94%", overflow: "auto" }}>
              {messages.length
                ? messages.map((message, idx) => (
                    <Box
                      key={idx}
                      sx={{ display: "flex", gap: 1, alignItems: "center" }}
                      m={2}
                    >
                      <Avatar {...stringAvatar(message.peername)} />
                      <Typography fontSize={"1.2rem"}>
                        <span
                          style={{ backgroundColor: "#cccccc", padding: 5 }}
                        >
                          {message.peername}:
                        </span>{" "}
                        {message.message}
                        <span style={{ marginLeft: "5px", fontSize: "14px" }}>
                          {moment(message.time).format("LT")}
                        </span>
                        <span
                          style={{
                            cursor: "pointer",
                            color: "blue",
                            marginLeft: "5px",
                          }}
                          onClick={() => {
                            translateMessage(message.message, idx);
                          }}
                        >
                          <TranslateIcon />
                        </span>
                      </Typography>
                    </Box>
                  ))
                : null}
              <div ref={messagesEndRef} />
            </Box>
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                bottom: 0,
                borderTop: "1px solid",
              }}
            >
              <Paper
                component={"form"}
                onSubmit={handleSubmit}
                sx={{
                  p: "3px 0px",
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  value={message}
                  ref={chatInputRef}
                  autoFocus
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type something here..."
                  inputProps={{ "aria-label": "chat message prompt" }}
                />
                <IconButton
                  onClick={handleSubmit}
                  type="button"
                  sx={{ p: "10px" }}
                  aria-label="search"
                >
                  <SendIcon />
                </IconButton>
              </Paper>
            </Box>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: "1px solid",
          padding: "10px 0",
        }}
      >
        <Grid container justifyContent={"center"} gap={2}>
          {useAudio ? (
            <Grid
              item
              onClick={handleMuteAudio}
              backgroundColor={"blue"}
              sx={{
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                width: "70px",
                height: "70px",
                color: "#fff",
              }}
            >
              <MicIcon sx={{ fontSize: "36px" }} />
            </Grid>
          ) : (
            <Grid
              item
              onClick={handleUnmuteAudio}
              backgroundColor={"red"}
              sx={{
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                width: "70px",
                height: "70px",
                color: "#fff",
              }}
            >
              <MicOffIcon sx={{ fontSize: "36px" }} />
            </Grid>
          )}
          {useVideo ? (
            <Grid
              item
              backgroundColor={"blue"}
              sx={{
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                width: "70px",
                height: "70px",
                color: "#fff",
              }}
              onClick={handleHideVideo}
            >
              <VideocamIcon sx={{ fontSize: "36px" }} />
            </Grid>
          ) : (
            <Grid
              item
              backgroundColor={"red"}
              sx={{
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                width: "70px",
                height: "70px",
                color: "#fff",
              }}
              onClick={handleShowVideo}
            >
              <VideocamOffIcon sx={{ fontSize: "36px" }} />
            </Grid>
          )}

          {recAudio ? (
            <Grid
              item
              backgroundColor={"blue"}
              sx={{
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                width: "70px",
                height: "70px",
                color: "#fff",
                background: "red",
              }}
            >
              <span
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setRecAudio(false);
                  setRecordState(RecordState.STOP);
                }}
              >
                <Box
                  borderRadius={"50%"}
                  sx={{
                    color: "white",
                    width: "50px",
                    height: "50px",
                    fontSize: "32px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <RadioButtonCheckedIcon />
                </Box>
              </span>
            </Grid>
          ) : (
            <Grid
              item
              backgroundColor={"blue"}
              sx={{
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                width: "70px",
                height: "70px",
                color: "#fff",
              }}
            >
              <span
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setRecAudio(true);
                  setRecordState(RecordState.START);
                }}
              >
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
                  <RadioButtonUncheckedIcon />
                </Box>
              </span>
            </Grid>
          )}
          <Grid
            item
            backgroundColor={"blue"}
            sx={{
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              width: "70px",
              height: "70px",
              color: "#fff",
            }}
            onClick={() => setShowChat(!showChat)}
          >
            <ChatIcon sx={{ fontSize: "36px" }} />
          </Grid>
          {viewCaption ? (
            <Grid
              item
              backgroundColor={"blue"}
              sx={{
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                width: "70px",
                height: "70px",
                color: "#fff",
              }}
              onClick={() => setViewCaption(!viewCaption)}
            >
              <ClosedCaptionIcon sx={{ fontSize: "36px" }} />
            </Grid>
          ) : (
            <Grid
              item
              backgroundColor={"red"}
              sx={{
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                width: "70px",
                height: "70px",
                color: "#fff",
              }}
              onClick={() => setViewCaption(!viewCaption)}
            >
              <ClosedCaptionDisabledIcon sx={{ fontSize: "36px" }} />
            </Grid>
          )}
          <Grid
            item
            backgroundColor={"red"}
            sx={{
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              width: "70px",
              height: "70px",
              color: "#fff",
            }}
            onClick={() => {
              handleDisconnect();
              navigate("/");
            }}
          >
            <CallEndIcon sx={{ fontSize: "36px" }} />
          </Grid>
          <AudioReactRecorder
            state={recordState}
            onStop={onStop}
            canvasWidth={0}
            canvasHeight={0}
          />
        </Grid>
      </Box>
    </Box>
  );
};
