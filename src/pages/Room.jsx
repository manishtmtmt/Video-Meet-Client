import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import { io as socketIOClient } from "socket.io-client";
import { config } from "../app.config";
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
import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import { RemoteVideos } from "../components/RemoteVideos";

const MODE_STREAM = "stream";
const MODE_SHARE_SCREEN = "share_screen";

export const Room = ({ socketRef }) => {
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

  const [useVideo, setUseVideo] = useState(true);
  const [useAudio, setUseAudio] = useState(true);
  const [isStartMedia, setIsStartMedia] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteVideos, setRemoteVideos] = useState({});
  const [isShareScreen, setIsShareScreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState();
  const [messages, setMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(Object.keys(remoteVideos).length / itemsPerPage);

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

  const handleHideVideo = () => {
    localStream.current.getTracks()[1].enabled = false;
    setUseVideo(false);
  };

  const handleShowVideo = () => {
    localStream.current.getTracks()[1].enabled = true;
    setUseVideo(true);
  };

  async function handleConnectScreenShare() {
    if (!localStreamScreen.current) {
      console.warn("WARN: local media NOT READY");
      return;
    }

    // --- get capabilities --
    const data = await sendRequest("getRouterRtpCapabilities", {
      roomName: roomId,
      peername: location.state.username,
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
        // playVideo(localVideo.current, stream);
        localVideo.current.srcObject = stream;
        setIsStartMedia(true);
      })
      .catch((err) => {
        console.error("media ERROR:", err);
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
    element.volume = 1;
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

  function addRemoteTrack(id, track, mode, remotePeerName) {
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
      addRemoteTrack(remoteSocketId, consumer.track, mode, data.remotePeerName);
      resolve();
    });
  }

  async function handleConnect() {
    if (!localStream.current) {
      console.warn("WARN: local media NOT READY");
      return;
    }

    // --- connect socket.io ---
    await connectSocket().catch((err) => {
      console.error(err);
      return;
    });

    console.log("connected");

    // --- get capabilities --
    const data = await sendRequest("getRouterRtpCapabilities", {
      roomName: roomId,
      peername: location.state.username,
    });
    console.log("getRouterRtpCapabilities:", data);
    await loadDevice(data);

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
  }

  async function subscribe() {
    // console.log(socketRef.current);
    if (!socketRef.current) {
      await connectSocket().catch((err) => {
        console.error(err);
        return;
      });
    }

    // --- get capabilities --
    const data = await sendRequest("getRouterRtpCapabilities", {
      roomName: roomId,
      peername: location.state.username,
    });
    console.log("getRouterRtpCapabilities:", data);
    await loadDevice(data);
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

      console.log(
        "audioConsumers count=" + Object.keys(audioConsumers.current).length
      );
    } else {
      console.warn("UNKNOWN consumer kind=" + kind);
    }
  }

  const connectSocket = () => {
    console.log(config.SERVER_ENDPOINT);
    if (!socketRef.current) {
      console.log("socketRef.current", socketRef.current);
      const io = socketIOClient(
        "http://" + config.SERVER_ENDPOINT + "/video-conference"
      );
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

    console.log("MESSAGE =>", message);
    await sendRequest("message", { message }).catch((err) => {
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
    }
  }, [isStartMedia, messages]);

  return (
    <Box>
      <Box height={"90vh"} sx={{ display: "flex" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "90%",
            height: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItem: "center",
              height: "100%",
              width: "100%",
              marginLeft: "15%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItem: "center",
                width: "40%",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "350px",
                  alignSelf: "center",
                }}
              >
                <video
                  ref={localVideo}
                  autoPlay
                  style={{ width: "100%", height: "100%" }}
                ></video>
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: 3,
                    right: "15%",
                    padding: "5px",
                    color: "#fff",
                    backgroundColor: "#0f0f0f",
                  }}
                >
                  {location.state?.username} (You)
                </Typography>
              </Box>
            </Box>
            <RemoteVideos
              remoteVideos={remoteVideos}
              playVideo={playVideo}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
            />
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
        </Grid>
      </Box>
    </Box>
  );
};
