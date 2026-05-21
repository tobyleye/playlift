import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  colors: {
    "spotify-green": "rgb(34, 197, 94)",
    "youtube-red": "rgb(239, 68, 68)",

    brand: {
      accent: "#C8F04A",
      accentDim: "rgba(200, 240, 74, 0.12)",
      accentDim2x: "rgba(200, 240, 74, 0.1)",
      accentBorder: "rgba(200, 240, 74, 0.30)",
      bg: "#0D0D0D",
      surface: "#161616",
      card: "#1E1E1E",
      card2: "#252525",
      spotify: "#1DB954",
      spotifyDim: "rgba(29, 185, 84, 0.12)",
      spotifyBorder: "rgba(29, 185, 84, 0.30)",
      youtube: "#FF3B30",
      youtubeDim: "rgba(255, 59, 48, 0.12)",
      youtubeBorder: "rgba(255, 59, 48, 0.30)",
    },
  },
  semanticTokens: {
    colors: {
      "text.primary": "#F0F0F0",
      "text.muted": "rgba(240, 240, 240, 0.50)",
      "text.muted2": "rgba(240, 240, 240, 0.3)",
      "border.subtle": "rgba(255, 255, 255, 0.07)",
      "border.medium": "rgba(255, 255, 255, 0.14)",
      "border.strong": "rgba(255, 255, 255, 0.22)",
    },
  },

  fonts: {
    heading: `'DM Serif Display', serif`,
    // heading: `'Outfit', sans-serif`,
    body: `'DM Sans', sans-serif`,
    mono: `'DM Mono', 'Courier New', monospace`,
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
        fontFamily: "body",
        bg: "brand.bg",
        color: "text.primary",
      },
      "h1,h2,h3,h4,h5,h6": {
        fontFamily: "heading",
      },
    },
  },
});
