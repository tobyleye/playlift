import { Music, Clock, CheckCircle, Loader2 } from "lucide-react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Progress,
  Button,
  HStack,
} from "@chakra-ui/react";
import useSWR from "swr";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import YoutubeMusicIcon from "../../icons/youtubemusic";
import SpotifyIcon from "../../icons/spotify";

function PlatformIcon({ platform }: { platform: "youtube_music" | "spotify" }) {
  return platform === "youtube_music" ? (
    <YoutubeMusicIcon />
  ) : platform === "spotify" ? (
    <SpotifyIcon />
  ) : null;
}
export default function ConversionStatus() {
  const navigate = useNavigate();
  const params = useParams();

  const { data: conversionData, isLoading } = useSWR(
    `conversion/${params.conversionId}`,
    () => api.fetchSingleConversion(params.conversionId as string)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!conversionData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <p className="text-red-500">
          Error loading conversion status. Please try again.
        </p>
      </div>
    );
  }

  console.log("data:", conversionData);

  // const conversionData = {
  //   playlist: {
  //     title: "My Awesome Playlist",
  //     creator: "John Doe",
  //     trackCount: 25,
  //     duration: "1h 35m",
  //   },
  //   tracks: Array.from({ length: 25 }, (_, i) => ({
  //     id: i + 1,
  //     title: `Song ${i + 1}`,
  //     artist: `Artist ${i + 1}`,
  //     status: Math.random() > 0.3 ? "completed" : "converting",
  //   })),
  //   overallProgress: 70, // percentage
  // };

  const tracks = conversionData.playlist_info.tracks;
  const { result } = conversionData;
  return (
    <Box
      minH="100vh"
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
        // rounded="3xl"
        // shadow="2xl"
        overflow="hidden"
      >
        <Box p={8} md={{ p: 12 }}>
          <Heading
            as="h1"
            fontSize="2xl"
            fontWeight="bold"
            color="gray.800"
            _dark={{ color: "white" }}
            mb={6}
          >
            Conversion Status
          </Heading>

          <Box mb={8}>
            <HStack spacing={4} mb={4}>
              <Box w={24} h={24} bg="gray.200" rounded="lg"></Box>
              <Box>
                <Heading as="h2" fontSize="xl" fontWeight="semibold">
                  {conversionData.title}
                </Heading>
                <Text fontSize="sm" color={"gray.500"}>
                  By {conversionData.creator || "Todo"}
                </Text>
                <HStack spacing={2} mt={2}>
                  <Music className="w-4 h-4 text-teal-500" />
                  <Text fontSize="sm">{tracks.total} tracks</Text>
                  <Clock className="w-4 h-4 text-teal-500 ml-2" />
                  <Text fontSize="sm">{conversionData.duration || "Todo"}</Text>
                </HStack>
              </Box>
            </HStack>
            <Progress value={conversionData.overallProgress} w="full" />
            <Text fontSize="sm" color={"gray.500"} mt={2}>
              Overall Progress: {conversionData.overallProgress}%
            </Text>
          </Box>

          <Box
            // h="400px"
            rounded="md"
            border="1px"
            borderColor="gray.200"
            p={4}
            // overflowY="auto"
          >
            {tracks.tracks.map((track: any) => {
              const trackResult = result ? result[track.id] : null;
              const status = trackResult
                ? trackResult === "error"
                  ? "failed"
                  : "completed"
                : "pending";

              return (
                <Flex
                  key={track.id}
                  justifyContent="space-between"
                  alignItems="center"
                  py={2}
                  borderBottom="1px"
                  borderColor="gray.200"
                  _last={{ borderBottom: "none" }}
                >
                  <Box>
                    <Text fontWeight="medium">{track.name}</Text>
                    <Text fontSize="sm" color={"gray.500"}>
                      {track.artists}
                    </Text>
                  </Box>
                  <HStack>
                    {status === "failed" ? (
                      <Text color="red.500">error</Text>
                    ) : status === "completed" ? (
                      <Box>
                        <a href={trackResult} target="_blank">
                          <PlatformIcon
                            platform={conversionData.destination_platform}
                          />
                        </a>
                      </Box>
                    ) : (
                      <Text color="gray.300">Pending</Text>
                    )}
                  </HStack>
                </Flex>
              );
            })}
          </Box>

          <Button
            w="full"
            mt={6}
            bg="teal.500"
            _hover={{ bg: "teal.600" }}
            color="white"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>

          <Box mt={4} display="flex" justifyContent="space-between">
            <Button
              bg="blue.500"
              _hover={{ bg: "blue.600" }}
              color="white"
              onClick={() => {
                /* Implement refresh logic */
              }}
            >
              Refresh Status
            </Button>
            <Button bg="purple.500" _hover={{ bg: "purple.600" }} color="white">
              Transfer to My Account
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
    // <div className="min-h-screen bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    //   <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
    //     <div className="p-8 md:p-12">
    //       <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
    //         Conversion Status
    //       </h1>

    //       <div className="mb-8">
    //         <div className="flex items-center space-x-4 mb-4">
    //           <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
    //           <div>
    //             <h2 className="text-xl font-semibold">
    //               {conversionData.playlist.title}
    //             </h2>
    //             <p className="text-sm text-gray-500 dark:text-gray-400">
    //               By {conversionData.playlist.creator}
    //             </p>
    //             <div className="flex items-center space-x-2 mt-2">
    //               <Music className="w-4 h-4 text-teal-500" />
    //               <span className="text-sm">
    //                 {conversionData.playlist.trackCount} tracks
    //               </span>
    //               <Clock className="w-4 h-4 text-teal-500 ml-2" />
    //               <span className="text-sm">
    //                 {conversionData.playlist.duration}
    //               </span>
    //             </div>
    //           </div>
    //         </div>
    //         <Progress
    //           value={conversionData.overallProgress}
    //           className="w-full"
    //         />
    //         <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
    //           Overall Progress: {conversionData.overallProgress}%
    //         </p>
    //       </div>

    //       <ScrollArea className="h-[400px] rounded-md border p-4">
    //         {conversionData.tracks.map((track: any) => (
    //           <div
    //             key={track.id}
    //             className="flex justify-between items-center py-2 border-b last:border-b-0"
    //           >
    //             <div>
    //               <p className="font-medium">{track.title}</p>
    //               <p className="text-sm text-gray-500 dark:text-gray-400">
    //                 {track.artist}
    //               </p>
    //             </div>
    //             <div className="flex items-center">
    //               {track.status === "completed" ? (
    //                 <CheckCircle className="w-5 h-5 text-green-500" />
    //               ) : (
    //                 <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
    //               )}
    //               <span className="ml-2 text-sm capitalize">
    //                 {track.status}
    //               </span>
    //             </div>
    //           </div>
    //         ))}
    //       </ScrollArea>

    //       <Button
    //         className="w-full mt-6 bg-teal-500 hover:bg-teal-600 text-white"
    //         onClick={() => navigate("/")} // Assuming '/' is the home page
    //       >
    //         Back to Home
    //       </Button>
    //     </div>
    //   </div>
    // </div>
  );
}
