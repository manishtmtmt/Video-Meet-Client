import { Box, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";

const CreateRemoteVideos = (props) => {
  console.log(
    "🚀 ~ file: RemoteVideos.jsx:5 ~ CreateRemoteVideos ~ props:",
    props
  );
  const remoteVideo = React.useRef();

  const playVideo = (element, stream) => {
    if (element.srcObject) {
      console.warn("element ALREADY playing, so ignore");
      return;
    }

    element.srcObject = new MediaStream([stream.getVideoTracks()[0]]);
    return element.play();
  };

  React.useEffect(() => {
    remoteVideo.current.load();
    playVideo(remoteVideo.current, props.peer.stream)
      .then((_) => {
        console.log("remote video: video playback started :)");
      })
      .catch((e) => {
        console.log("remote video: video playback failed ;(", e);
      });
  }, [props.peer.stream]);

  return (
    <>
      <video
        ref={remoteVideo}
        autoPlay
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
          borderRadius: "15px",
        }}
      ></video>
      {!props.peer.videoEnabled ? (
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
            {props.peer?.peerName}
          </Typography>
        </Box>
      ) : null}
    </>
  );
};
export const MemoizedCreateRemoteVideos = React.memo(CreateRemoteVideos);

const CreateRemoteAudio = (props) => {
  console.log(
    "🚀 ~ file: RemoteVideos.jsx:49 ~ CreateRemoteAudio ~ props:",
    props
  );
  const audioRef = React.useRef();
  const playAudio = (element, stream) => {
    console.log("🚀 ~ file: RemoteVideos.jsx:55 ~ playAudio ~ stream:", stream);
    if (element.srcObject) {
      console.warn("Audio is already playing");
      return;
    }

    element.srcObject = stream;
    return element.play();
  };
  useEffect(() => {
    playAudio(audioRef.current, props.peer.stream)
      .then((_) => {
        audioRef.current.volume = 1;
        console.log("Audio playback started :)");
      })
      .catch((err) => {
        console.log("Audio playback failed :(", err);
      });
  }, []);

  return <audio ref={audioRef} autoPlay></audio>;
};

export const RemoteVideos = ({
  remoteVideos,
  playVideo,
  currentPage,
  itemsPerPage,
}) => {
  const currentPageData = Object.keys(remoteVideos).slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <>
      {currentPageData.map((key, index) => {
        return Object.keys(remoteVideos[key]).map((key2, index2) => {
          const peer = remoteVideos[key][key2];
          return (
            <Box
              key={peer.socket_id + "__" + key2}
              sx={{
                boxSizing: "border-box !important",
                // flex: "2 0 calc(50% - 20px)",
                flex: "0.2 0 calc(50% - 20px)",
                height: currentPageData.length > 2 ? "46%" : "auto",
                margin: "10px",
                position: "relative",
              }}
            >
              <CreateRemoteVideos peer={peer} playVideo={playVideo} />
              {peer.videoEnabled ? (
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: 3,
                    right: "3%",
                    padding: "5px",
                    color: "#fff",
                    backgroundColor: "#0f0f0f",
                  }}
                >
                  {peer?.peerName}
                </Typography>
              ) : null}
            </Box>
          );
        });
      })}
      {Object.keys(remoteVideos).map((key, index) => {
        return Object.keys(remoteVideos[key]).map((key2, index2) => {
          const peer = remoteVideos[key][key2];
          return (
            <CreateRemoteAudio
              key={peer.socket_id + "__" + key2 + "__" + index2}
              peer={peer}
            />
          );
        });
      })}
    </>
  );
};
