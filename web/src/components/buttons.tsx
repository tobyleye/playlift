import { Button } from "@chakra-ui/react";
import SpotifyIcon from "../icons/spotify";
import YoutubeMusicIcon from "../icons/youtubemusic";

export const GoogleLoginButton = ({
  url,
  label,
}: {
  url?: string;
  label: string;
}) => {
  return (
    <Button
      onClick={() => {
        window.open(url, "_self");
      }}
      leftIcon={<YoutubeMusicIcon />}
    >
      {label}
    </Button>
  );
};

export const SpotifyLoginButton = ({
  url,
  label = "Connect Spotify",
}: {
  url?: string;
  label?: string;
}) => {
  return (
    <Button
      onClick={() => {
        window.open(url, "_self");
      }}
      leftIcon={<SpotifyIcon />}
    >
      {label}
    </Button>
  );
};
