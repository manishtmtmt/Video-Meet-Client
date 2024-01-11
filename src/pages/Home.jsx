import { Button, Card, CardMedia, Container, Grid } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();

  return (
    <Container
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Grid container width={"50%"} justifyContent={"space-between"}>
        <Grid item>
          <Card>
            <CardMedia
              component={"img"}
              image="https://cdn.builder.io/api/v1/image/assets/TEMP/30151db0ee1b40938782babc5291a34fe18eecf77cb67f359a5027e2323d6d32?apiKey=9419d809f01d4a68aa9c1aefd6739cf4&"
            />
          </Card>
        </Grid>
        <Grid item width={"50%"} sx={{ display: "flex", alignItems: "center" }}>
          <Grid
            container
            direction={"column"}
            justifyContent={"center"}
            gap={3}
          >
            <Grid item>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/create")}
              >
                Create Room
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/join")}
              >
                Join Room
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};
