import { Box, Typography } from "@mui/material";
import React from "react";

const CreateRemoteVideos = (props) => {
  const remoteVideo = React.useRef();
  React.useEffect(() => {
    // if (remoteVideo.current.srcObject) {
    //     remoteVideo.current.srcObject.addTrack(props.track);
    //         return;
    //     }
    props
      .playVideo(remoteVideo.current, props.peer.stream)
      ?.then(() => {
        remoteVideo.current.volume = 1;
      })
      .catch((err) => {
        console.error("media ERROR:", err);
      });
  }, []);
  return (
    <video
      ref={remoteVideo}
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
