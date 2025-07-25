import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  colors: {
    "spotify-green": "rgb(34, 197, 94)",
    "youtube-red": "rgb(239, 68, 68)",
  },
  styles: {
    global: {
      button: {
        cursor: "pointer",

        "&:disabled": {
          cursor: "auto",
        },
      },
      a: {
        textDecoration: "none",
        "&:hover": {
          textDecoration: "none",
        },
      },
      html: {
        height: "100%",
        width: "100%",
      },
      body: {
        minHeight: "100%",
        width: "100%",

        bg: "linear-gradient(to right bottom, rgb(88, 28, 135), rgb(30, 58, 138), rgb(49, 46, 129))",
        color: "white",
      },
    },
  },
});
