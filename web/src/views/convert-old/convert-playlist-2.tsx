import { ReactElement, useEffect, useState } from "react";
import { ArrowRight, Loader2, Music, Check, Clock } from "lucide-react";
import YoutubeMusicIcon from "../../icons/youtubemusic";
import SpotifyIcon from "../../icons/spotify";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import PlaylistPreview from "../../components/PlaylistPreview";

const defaultPlaylist =
  "https://open.spotify.com/album/5q2iMctlDvEMYVIawF6Vop?si=CLbha0kxSxKkDO_bcO5KyQ";

export default function ConvertPlaylist() {
  const [playlistUrl, setPlaylistUrl] = useState(defaultPlaylist);
  const [platform, setPlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playlistData, setPlaylistData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [destination, setDestination] = useState("");

  const toast = useToast();

  const navigate = useNavigate();

  const detectPlatform = (url: string) => {
    if (url.includes("spotify.com")) return "spotify";
    if (url.includes("music.youtube.com")) return "youtube";
    // if (url.includes("music.apple.com")) return "apple";
    // if (url.includes("deezer.com")) return "deezer";
    return null;
  };

  useEffect(() => {
    setPlatform(detectPlatform(playlistUrl));
  }, [playlistUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPlaylistUrl(url);
  };

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const data = await api.previewLink(playlistUrl);
      console.log("data --", data);
      setPlaylistData(data);
      setIsPreviewOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleConvert = async () => {
    try {
      // Implement actual conversion logic here
      console.log("Converting playlist:", playlistData, playlistUrl);
      const response = await api.convert(playlistUrl, destination);
      console.log("response --", response);
      let jobId = response.job_id;
      if (jobId) {
        navigate(`/status2/${jobId}`);
      } else {
        throw new Error("nothing happened!");
      }
    } catch (err) {
      console.log(err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const renderPlatformLogo = () => {
    if (!platform) return null;
    const platformLogos: Record<string, ReactElement> = {
      spotify: <SpotifyIcon style={{ height: 30, width: 30 }} />,
      youtubemusic: <YoutubeMusicIcon style={{ height: 30, width: 30 }} />,
    };
    return platformLogos[platform] || <></>;
  };

  const conversionOptions = [
    { label: "Select an option", value: "", disabled: true },
    { label: "spotify", value: "spotify" },
    {
      label: "Youtube music",
      value: "youtubemusic",
    },
  ].filter((opt) => opt.value !== platform);

  return (
    <Box
      minH="screen"
      bgGradient="linear(to-r, teal.50, cyan.50)"
      _dark={{ bgGradient: "linear(to-r, gray.900, gray.800)" }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        w="full"
        maxW="3xl"
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="3xl"
        shadow="2xl"
        overflow="hidden"
      >
        <Box p={8} md={{ p: 12 }}>
          <Flex alignItems="center" justifyContent="space-between" mb={8}>
            <Flex alignItems="center" spaceX={3}>
              <Music className="w-8 h-8 text-teal-500 dark:text-teal-400" />
              <Heading
                as="h1"
                fontSize="2xl"
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: "white" }}
              >
                Playlist Converter
              </Heading>
            </Flex>
            <Flex spaceX={2}>
              <SpotifyIcon className="w-5 h-5" />
              <YoutubeMusicIcon className="w-5 h-5" />
            </Flex>
          </Flex>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePreview();
            }}
            className="space-y-6"
          >
            <FormControl id="playlist-url" isRequired>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color="gray.700"
                _dark={{ color: "gray.300" }}
              >
                Enter your playlist URL
              </FormLabel>
              <Box position="relative">
                <Input
                  type="url"
                  placeholder="https://open.spotify.com/playlist/..."
                  value={playlistUrl}
                  onChange={handleInputChange}
                  pr="10"
                  focusBorderColor="teal.500"
                />
                {platform && (
                  <Box
                    position="absolute"
                    insetY="0"
                    right="0"
                    display="flex"
                    alignItems="center"
                    pr={3}
                    pointerEvents="none"
                  >
                    <Check className="h-5 w-5 text-teal-500" />
                  </Box>
                )}
              </Box>
            </FormControl>

            {platform && (
              <Flex
                alignItems="center"
                spaceX={2}
                bg="teal.50"
                _dark={{ bg: "teal.900/30" }}
                rounded="lg"
                p={3}
              >
                {renderPlatformLogo()}
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="teal.800"
                    _dark={{ color: "teal.200" }}
                    textTransform="capitalize"
                  >
                    {platform} Playlist Detected
                  </Text>
                  <Text
                    fontSize="xs"
                    color="teal.600"
                    _dark={{ color: "teal.300" }}
                  >
                    Ready to preview your playlist
                  </Text>
                </Box>
              </Flex>
            )}

            {platform && (
              <FormControl id="destination-platform" isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  _dark={{ color: "gray.300" }}
                >
                  Specify destination platform
                </FormLabel>
                <Select
                  onChange={(e) => setDestination(e.target.value)}
                  value={destination}
                  focusBorderColor="teal.500"
                  bg="white"
                >
                  {conversionOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled ? opt.disabled : false}
                    >
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}

            <Button
              type="submit"
              w="full"
              bg="teal.600"
              _hover={{ bg: "teal.700" }}
              color="white"
              isDisabled={isLoading || (!platform && !destination)}
            >
              {isLoading ? (
                <>
                  <Spinner mr={2} size="sm" />
                  Loading Preview...
                </>
              ) : (
                <>
                  Preview Playlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
          <PlaylistPreview
            isPreviewOpen={isPreviewOpen}
            setIsPreviewOpen={setIsPreviewOpen}
            playlistData={playlistData}
            onConvert={handleConvert}
            destination={destination}
          />

          <Box mt={8} textAlign="center">
            <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
              We support conversions between Spotify, Apple Music, and YouTube
              Music.
            </Text>
            <Text
              fontSize="xs"
              color="gray.400"
              _dark={{ color: "gray.500" }}
              mt={2}
            >
              By converting, you agree to our Terms of Service and Privacy
              Policy.
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // return (
  //   <div className="min-h-screen bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
  //     <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
  //       <div className="p-8 md:p-12">
  //         <div className="flex items-center justify-between mb-8">
  //           <div className="flex items-center space-x-3">
  //             <Music className="w-8 h-8 text-teal-500 dark:text-teal-400" />
  //             <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
  //               Playlist Converter
  //             </h1>
  //           </div>
  //           <div className="flex space-x-2">
  //             <SpotifyIcon className="w-5 h-5" />
  //             <YoutubeMusicIcon className="w-5 h-5" />
  //           </div>
  //         </div>

  //         <form
  //           onSubmit={(e) => {
  //             e.preventDefault();
  //             handlePreview();
  //           }}
  //           className="space-y-6"
  //         >
  //           <div className="space-y-2">
  //             <label
  //               htmlFor="playlist-url"
  //               className="text-sm font-medium text-gray-700 dark:text-gray-300"
  //             >
  //               Enter your playlist URL
  //             </label>
  //             <div className="relative">
  //               <Input
  //                 id="playlist-url"
  //                 type="url"
  //                 placeholder="https://open.spotify.com/playlist/..."
  //                 value={playlistUrl}
  //                 onChange={handleInputChange}
  //                 className="w-full pr-10 focus:ring-teal-500 focus:border-teal-500"
  //                 required
  //               />
  //               {platform && (
  //                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
  //                   <Check className="h-5 w-5 text-teal-500" />
  //                 </div>
  //               )}
  //             </div>
  //           </div>

  //           {platform && (
  //             <div className="flex items-center space-x-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg p-3">
  //               {renderPlatformLogo()}
  //               <div>
  //                 <p className="text-sm font-medium text-teal-800 dark:text-teal-200 capitalize">
  //                   {platform} Playlist Detected
  //                 </p>
  //                 <p className="text-xs text-teal-600 dark:text-teal-300">
  //                   Ready to preview your playlist
  //                 </p>
  //               </div>
  //             </div>
  //           )}

  //           {platform && (
  //             <div className="space-y-2">
  //               <label
  //                 htmlFor="playlist-url"
  //                 className="text-sm font-medium text-gray-700 dark:text-gray-300"
  //               >
  //                 Specify destination platform
  //               </label>
  //               <div className="relative">
  //                 <select
  //                   onChange={(e) => setDestination(e.target.value)}
  //                   value={destination}
  //                   className="w-full h-10  text-sm border  rounded-md focus:ring-teal-500 focus:border-teal-500 px-4 bg-white"
  //                 >
  //                   {conversionOptions.map((opt) => (
  //                     <option
  //                       key={opt.value}
  //                       value={opt.value}
  //                       disabled={opt.disabled ? opt.disabled : false}
  //                     >
  //                       {opt.label}
  //                     </option>
  //                   ))}
  //                 </select>
  //               </div>
  //             </div>
  //           )}

  //           <Button
  //             type="submit"
  //             className="w-full bg-teal-600 hover:bg-teal-700 text-white transition-all duration-200 ease-in-out transform hover:scale-105"
  //             disabled={isLoading || (!platform && !destination)}
  //           >
  //             {isLoading ? (
  //               <>
  //                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
  //                 Loading Preview...
  //               </>
  //             ) : (
  //               <>
  //                 Preview Playlist
  //                 <ArrowRight className="ml-2 h-5 w-5" />
  //               </>
  //             )}
  //           </Button>
  //         </form>
  //         <Preview
  //           isPreviewOpen={isPreviewOpen}
  //           setIsPreviewOpen={setIsPreviewOpen}
  //           playlistData={playlistData}
  //           onConvert={handleConvert}
  //           destination={destination}
  //         />

  //         <div className="mt-8 text-center">
  //           <p className="text-sm text-gray-500 dark:text-gray-400">
  //             We support conversions between Spotify, Apple Music, and YouTube
  //             Music.
  //           </p>
  //           <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
  //             By converting, you agree to our Terms of Service and Privacy
  //             Policy.
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}
