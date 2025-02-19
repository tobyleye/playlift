import { useState, useEffect } from "react";
import {
  Music,
  Clock,
  CheckCircle,
  Loader2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import api from "../../api/api";
import {
  Box,
  Flex,
  Heading,
  Text,
  Progress,
  Button,
  useColorModeValue,
  VStack,
  HStack,
  Image,
  useToast,
} from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";

// Mock function to fetch conversion status

// Mock function to transfer playlist
const transferPlaylist = async (jobId: string) => {
  // Simulating API call
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { success: true, message: "Playlist transferred successfully" };
};

export default function ConversionStatus() {
  const navigate = useNavigate();
  const params = useParams();
  console.log("params --", params);
  const jobId = params.jobId;
  const [isTransferring, setIsTransferring] = useState(false);
  const toast = useToast();

  const { data, isLoading } = useSWR(`conversion/${jobId}`, () =>
    api.fetchJobStatus(jobId as string)
  );

  const handleTransfer = async () => {
    if (!jobId) return;
    setIsTransferring(true);
    try {
      const result = await transferPlaylist(jobId as string);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to transfer playlist",
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const conversionData = {
    PlaylistInfo: {
      tracks: {
        tracks: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          title: `Song ${i + 1}`,
          artist: `Artist ${i + 1}`,
          status: Math.random() > 0.3 ? "completed" : "converting",
        })),
      },
    },
    Result: {},
    Platform: "",
  };

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

  console.log("conversion data --", conversionData);

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

  const completedTracks = [];
  const failedTracks = 4;

  const {
    PlaylistInfo: playlistInfo,
    Result: result,
    Platform: destinationPlatform,
  } = conversionData;

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, teal.50, cyan.50)"
      _dark={{ bgGradient: "linear(to-r, gray.900, gray.800)" }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        w="full"
        maxW="4xl"
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="3xl"
        shadow="2xl"
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
                  {playlistInfo.name}
                </Heading>
                <Text fontSize="sm" color={"gray.500"}>
                  By {/* {conversionData.playlist.creator} */}
                </Text>
                <HStack spacing={2} mt={2}>
                  <Music className="w-4 h-4 text-teal-500" />
                  <Text fontSize="sm">
                    {/* {conversionData.playlist.trackCount} */}
                    tracks
                  </Text>
                  <Clock className="w-4 h-4 text-teal-500 ml-2" />
                  <Text fontSize="sm">
                    {/* {conversionData.playlist.duration} */}
                  </Text>
                </HStack>
                <Text fontSize="sm" color={"gray.500"} mt={2}>
                  From {/* {conversionData.playlist.sourcePlatform} */}
                  to {/* {conversionData.playlist.destinationPlatform} */}
                </Text>
              </Box>
            </HStack>
            {/* <Progress value={conversionData.overallProgress} w="full" /> */}
            <Flex justifyContent="space-between" alignItems="center" mt={2}>
              <Text fontSize="sm" color={"gray.500"}>
                Overall Progress: {/* {conversionData.overallProgress}% */}
              </Text>
              <Text fontSize="sm" color={"gray.500"}>
                {/* {completedTracks} completed, {failedTracks} failed */}
              </Text>
            </Flex>
          </Box>

          <Box
            h="400px"
            rounded="md"
            border="1px"
            borderColor="gray.200"
            p={4}
            overflowY="auto"
          >
            {playlistInfo.tracks.tracks.map((track: any) => {
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
                      {track.artist}
                    </Text>
                    {track.errorMessage && (
                      <Text fontSize="xs" color="red.500" mt={1}>
                        {track.errorMessage}
                      </Text>
                    )}
                    {status === "completed" && (
                      <Link
                        to={trackResult.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-500 hover:underline flex items-center mt-1"
                      >
                        View on {destinationPlatform}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    )}
                  </Box>
                  <HStack>
                    {status === "completed" && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {status === "pending" && (
                      <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                    )}
                    {status === "failed" && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <Text ml={2} fontSize="sm" textTransform="capitalize">
                      {status}
                    </Text>
                  </HStack>
                </Flex>
              );
            })}
          </Box>

          <Flex mt={6} justifyContent="space-between" alignItems="center">
            <Button
              bg="teal.500"
              _hover={{ bg: "teal.600" }}
              color="white"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
            <HStack spacing={2}>
              {conversionData.status !== "completed" && (
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
              )}
              <Button
                bg="purple.500"
                _hover={{ bg: "purple.600" }}
                color="white"
                onClick={handleTransfer}
                isDisabled={
                  isTransferring || conversionData.status !== "completed"
                }
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  "Transfer to My Account"
                )}
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Box>
    </Box>
    // <div className="min-h-screen bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    //   <Card className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
    //     <CardContent className="p-8 md:p-12">
    //       <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
    //         Conversion Status
    //       </h1>

    //       <div className="mb-8">
    //         <div className="flex items-center space-x-4 mb-4">
    //           <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
    //           <div>
    //             <h2 className="text-xl font-semibold">{playlistInfo.name}</h2>
    //             <p className="text-sm text-gray-500 dark:text-gray-400">
    //               By
    //               {/* {conversionData.playlist.creator} */}
    //             </p>
    //             <div className="flex items-center space-x-2 mt-2">
    //               <Music className="w-4 h-4 text-teal-500" />
    //               <span className="text-sm">
    //                 {/* {conversionData.playlist.trackCount}  */}
    //                 tracks
    //               </span>
    //               <Clock className="w-4 h-4 text-teal-500 ml-2" />
    //               <span className="text-sm">
    //                 {/* {conversionData.playlist.duration} */}
    //               </span>
    //             </div>
    //             <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
    //               From
    //               {/* {conversionData.playlist.sourcePlatform}  */}
    //               to {/* {conversionData.playlist.destinationPlatform} */}
    //             </p>
    //           </div>
    //         </div>
    //         {/* <Progress
    //           value={conversionData.overallProgress}
    //           className="w-full"
    //         /> */}
    //         <div className="flex justify-between items-center mt-2">
    //           <p className="text-sm text-gray-500 dark:text-gray-400">
    //             Overall Progress:
    //             {/* {conversionData.overallProgress}% */}
    //           </p>
    //           <p className="text-sm text-gray-500 dark:text-gray-400">
    //             {/* {completedTracks} completed, {failedTracks} failed */}
    //           </p>
    //         </div>
    //       </div>

    //       <ScrollArea className="h-[400px] rounded-md border p-4">
    //         {playlistInfo.tracks.tracks.map((track: any) => {
    //           let trackResult = result ? result[track.id] : null;
    //           let status = trackResult ? "completed" : "pending";

    //           return (
    //             <div
    //               key={track.id}
    //               className="flex justify-between items-center py-2 border-b last:border-b-0"
    //             >
    //               <div>
    //                 <p className="font-medium">{track.name}</p>
    //                 <p className="text-sm text-gray-500 dark:text-gray-400">
    //                   {track.artist}
    //                 </p>
    //                 {track.errorMessage && (
    //                   <p className="text-xs text-red-500 mt-1">
    //                     {track.errorMessage}
    //                   </p>
    //                 )}
    //                 {status === "completed" && (
    //                   <Link
    //                     to={trackResult.link}
    //                     target="_blank"
    //                     rel="noopener noreferrer"
    //                     className="text-xs text-teal-500 hover:underline flex items-center mt-1"
    //                   >
    //                     View on {destinationPlatform}
    //                     <ExternalLink className="w-3 h-3 ml-1" />
    //                   </Link>
    //                 )}
    //               </div>
    //               <div className="flex items-center">
    //                 {status === "completed" && (
    //                   <CheckCircle className="w-5 h-5 text-green-500" />
    //                 )}
    //                 {status === "pending" && (
    //                   <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
    //                 )}
    //                 {status === "failed" && (
    //                   <XCircle className="w-5 h-5 text-red-500" />
    //                 )}
    //                 <span className="ml-2 text-sm capitalize">{status}</span>
    //               </div>
    //             </div>
    //           );
    //         })}
    //       </ScrollArea>

    //       <div className="mt-6 flex justify-between items-center">
    //         <Button
    //           className="bg-teal-500 hover:bg-teal-600 text-white"
    //           onClick={() => navigate("/")} // Assuming '/' is the home page
    //         >
    //           Back to Home
    //         </Button>
    //         <div className="space-x-2">
    //           {conversionData.status !== "completed" && (
    //             <Button
    //               className="bg-blue-500 hover:bg-blue-600 text-white"
    //               onClick={() => {
    //                 /* Implement refresh logic */
    //               }}
    //             >
    //               Refresh Status
    //             </Button>
    //           )}
    //           <Button
    //             className="bg-purple-500 hover:bg-purple-600 text-white"
    //             onClick={handleTransfer}
    //             disabled={
    //               isTransferring || conversionData.status !== "completed"
    //             }
    //           >
    //             {isTransferring ? (
    //               <>
    //                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    //                 Transferring...
    //               </>
    //             ) : (
    //               "Transfer to My Account"
    //             )}
    //           </Button>
    //         </div>
    //       </div>
    //     </CardContent>
    //   </Card>
    // </div>
  );
}
