import backgroundImageLight from "./Assets/images/light/bg.png";
import backgroundImageDark from "./Assets/images/dark/bg.png";
import logoLight from "./Assets/images/light/logo.png";
import logoDark from "./Assets/images/dark/logo.png";
import signUpLight from "./Assets/images/light/sign_up.png";
import signUpDark from "./Assets/images/dark/sign_up.png";
import videoImage from "./Assets/utilImages/video.png";

const theme = {
  light: {
    assets: {
      bgImage: backgroundImageLight,
      logo: logoLight,
      signUp: signUpLight,
    },
    color: {
      primary: "#000",
      font2: "#7E8BB6",
      secondary: "#070E27",
    },
    utils: {
      videoImage: videoImage,
    },
  },
  dark: {
    assets: {
      bgImage: backgroundImageDark,
      logo: logoDark,
      signUp: signUpDark,
    },
    color: {
      primary: "#F4F7FF",
      font2: "#EBEBED",
      light: "#F4F7FF",
    },
    utils: {
      videoImage: videoImage,
    },
  },
};

export default theme;
