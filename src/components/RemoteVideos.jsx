import { Box, Typography } from "@mui/material";
import React from "react";

const CreateRemoteVideos = (props) => {
  console.log("🚀 ~ CreateRemoteVideos ~ props:", props);
  console.log("tracks: -->", props.peer.stream.getTracks());
  const remoteVideo = React.useRef();
  console.log("🚀 ~ CreateRemoteVideos ~ remoteVideo:", remoteVideo);

  const playVideo = (element, stream) => {
    console.log("element:", element);
    console.log("stream:", stream);
    if (element.srcObject) {
      console.warn("element ALREADY playing, so ignore");
      return;
    }

    element.srcObject = stream;
    element.volume = 0;
    return element.play();
  };

  React.useEffect(() => {
    remoteVideo.current.load();
    playVideo(remoteVideo.current, props.peer.stream).then(_ => {
      remoteVideo.current.volume = 1;
      console.log("remote video: video playback started :)");
    }).catch(e => {
      console.log("remote video: video playback failed ;(", e);
    })

    // if (playPromise !== undefined) {
    //   console.log("playPromise: -->", playPromise);
    //   playPromise
    //     .then((_) => {
    //       remoteVideo.current.volume = 1;
    //       console.log("remote video: video playback started :)");
    //     })
    //     .catch((e) => {
    //       console.log("remote video: video playback failed ;(", e);
    //     });
    // }
  }, []);
  return (
    <video
      ref={remoteVideo}
      controls
      autoPlay
      style={{ width: "100%", height: "100%" }}
    ></video>
  );
};
export const MemoizedCreateRemoteVideos = React.memo(CreateRemoteVideos);

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
                  marginLeft: (index + 1) % 2 !== 0 ? "-20%" : 0,
                }}
              >
                <MemoizedCreateRemoteVideos peer={peer} playVideo={playVideo} />
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
                  {peer?.peerName}
                </Typography>
              </Box>
            </Box>
          );
        });
      })}
    </>
  );
};
