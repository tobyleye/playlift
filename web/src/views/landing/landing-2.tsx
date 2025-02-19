import { ArrowRight, Music, Zap, Repeat, CheckCircle } from "lucide-react";

import {
  Box,
  Flex,
  Heading,
  Text,
  Link as ChakraLink,
  Button,
  Input,
  Container,
  Grid,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <Box
      minH="screen"
      w="full"
      bgGradient="linear(to-r, teal.50, cyan.50)"
      _dark={{ bgGradient: "linear(to-r, gray.900, gray.800)" }}
    >
      <Box
        as="header"
        px={4}
        py={6}
        display={"flex"}
        alignItems="center"
        justifyContent="space-between"
      >
        <Flex alignItems="center" rowGap={3}>
          <Music className="w-8 h-8 text-teal-500 dark:text-teal-400" />
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="gray.800"
            _dark={{ color: "white" }}
          >
            Playlist Converter
          </Text>
        </Flex>
        <Flex as="nav" display={{ base: "none", md: "flex" }} rowGap={6}>
          <ChakraLink
            as={Link}
            to="#features"
            color="gray.600"
            _hover={{ color: "teal.500" }}
            _dark={{ color: "gray.300", _hover: { color: "teal.400" } }}
          >
            Features
          </ChakraLink>
          <ChakraLink
            as={Link}
            to="#how-it-works"
            color="gray.600"
            _hover={{ color: "teal.500" }}
            _dark={{ color: "gray.300", _hover: { color: "teal.400" } }}
          >
            How It Works
          </ChakraLink>
          <ChakraLink
            as={Link}
            to="#"
            color="gray.600"
            _hover={{ color: "teal.500" }}
            _dark={{ color: "gray.300", _hover: { color: "teal.400" } }}
          >
            About
          </ChakraLink>
        </Flex>
        <Button bg="teal.500" _hover={{ bg: "teal.600" }} color="white">
          Get Started
        </Button>
      </Box>

      <Box as="main">
        <Box as="section" py={20} textAlign="center" px={4}>
          <Heading
            as="h1"
            fontSize={{ base: "4xl", md: "6xl" }}
            fontWeight="bold"
            color="gray.800"
            _dark={{ color: "white" }}
            mb={6}
          >
            Convert Your Playlists{" "}
            <Text as="span" color="teal.500" _dark={{ color: "teal.400" }}>
              Seamlessly
            </Text>
          </Heading>
          <Text
            fontSize="xl"
            color="gray.600"
            _dark={{ color: "gray.300" }}
            mb={8}
            maxW="2xl"
            mx="auto"
          >
            Switch between music platforms without losing your carefully curated
            playlists. Fast, easy, and free.
          </Text>
          <Flex justifyContent="center" rowGap={4}>
            <Button
              bg="teal.500"
              _hover={{ bg: "teal.600" }}
              color="white"
              fontSize="lg"
              px={8}
              py={3}
            >
              Start Converting
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              color="teal.500"
              borderColor="teal.500"
              _hover={{ bg: "teal.50" }}
              _dark={{
                color: "teal.400",
                borderColor: "teal.400",
                _hover: { bg: "teal.900/30" },
              }}
              fontSize="lg"
              px={8}
              py={3}
            >
              Learn More
            </Button>
          </Flex>
        </Box>

        <Box
          as="section"
          id="features"
          bg="white"
          _dark={{ bg: "gray.800" }}
          py={20}
        >
          <Container maxW="container.xl" px={4}>
            <Heading
              as="h2"
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="bold"
              textAlign="center"
              color="gray.800"
              _dark={{ color: "white" }}
              mb={12}
            >
              Why Choose Us?
            </Heading>
            <Grid templateColumns={{ md: "repeat(3, 1fr)" }} gap={8}>
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description:
                    "Convert your playlists in seconds, not minutes.",
                },
                {
                  icon: Repeat,
                  title: "Multiple Platforms",
                  description:
                    "Support for all major music streaming services.",
                },
                {
                  icon: CheckCircle,
                  title: "100% Accurate",
                  description:
                    "Our smart matching ensures you don't lose any tracks.",
                },
              ].map((feature, index) => (
                <Box
                  key={index}
                  bg="teal.50"
                  _dark={{ bg: "teal.900/30" }}
                  rounded="xl"
                  p={6}
                  textAlign="center"
                >
                  <feature.icon className="w-12 h-12 text-teal-500 dark:text-teal-400 mx-auto mb-4" />
                  <Heading
                    as="h3"
                    fontSize="xl"
                    fontWeight="semibold"
                    color="gray.800"
                    _dark={{ color: "white" }}
                    mb={2}
                  >
                    {feature.title}
                  </Heading>
                  <Text color="gray.600" _dark={{ color: "gray.300" }}>
                    {feature.description}
                  </Text>
                </Box>
              ))}
            </Grid>
          </Container>
        </Box>

        <Box as="section" id="how-it-works" py={20}>
          <Container maxW="container.xl" px={4}>
            <Heading
              as="h2"
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="bold"
              textAlign="center"
              color="gray.800"
              _dark={{ color: "white" }}
              mb={12}
            >
              How It Works
            </Heading>
            <Grid templateColumns={{ md: "repeat(3, 1fr)" }} gap={8}>
              {[
                {
                  step: 1,
                  title: "Select Platforms",
                  description:
                    "Choose your source and destination music platforms.",
                },
                {
                  step: 2,
                  title: "Pick Playlists",
                  description: "Select the playlists you want to transfer.",
                },
                {
                  step: 3,
                  title: "Convert & Enjoy",
                  description:
                    "Let our app do the magic and enjoy your music anywhere.",
                },
              ].map((step, index) => (
                <Box
                  key={index}
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                  rounded="xl"
                  p={6}
                  shadow="lg"
                >
                  <Box
                    bg="teal.500"
                    color="white"
                    rounded="full"
                    w={10}
                    h={10}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mb={4}
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    {step.step}
                  </Box>
                  <Heading
                    as="h3"
                    fontSize="xl"
                    fontWeight="semibold"
                    color="gray.800"
                    _dark={{ color: "white" }}
                    mb={2}
                  >
                    {step.title}
                  </Heading>
                  <Text color="gray.600" _dark={{ color: "gray.300" }}>
                    {step.description}
                  </Text>
                </Box>
              ))}
            </Grid>
          </Container>
        </Box>

        <Box
          as="section"
          bg="teal.500"
          _dark={{ bg: "teal.600" }}
          py={20}
          color="white"
        >
          <Container maxW="container.xl" px={4} textAlign="center">
            <Heading
              as="h2"
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="bold"
              mb={6}
            >
              Ready to Convert Your Playlists?
            </Heading>
            <Text fontSize="xl" mb={8} maxW="2xl" mx="auto">
              Join thousands of music lovers who have already made the switch.
              Try our playlist converter now!
            </Text>
            <Box maxW="md" mx="auto">
              <form className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  bg="whiteAlpha.20"
                  borderColor="whiteAlpha.30"
                  color="white"
                  _placeholder={{ color: "whiteAlpha.70" }}
                  focusBorderColor="white"
                />
                <Button
                  type="submit"
                  bg="white"
                  color="teal.500"
                  _hover={{ bg: "teal.50" }}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              <Text fontSize="sm" mt={4}>
                By signing up, you agree to our Terms & Conditions and Privacy
                Policy.
              </Text>
            </Box>
          </Container>
        </Box>
      </Box>

      <Box as="footer" bg="white" _dark={{ bg: "gray.800" }} py={8}>
        <Container maxW="container.xl" px={4}>
          <Flex
            flexDirection={{ base: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
          >
            <Flex alignItems="center" rowGap={3} mb={{ base: 4, md: 0 }}>
              <Music className="w-6 h-6 text-teal-500 dark:text-teal-400" />
              <Text
                fontSize="xl"
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: "white" }}
              >
                Playlist Converter
              </Text>
            </Flex>
            <Flex as="nav" rowGap={6}>
              <ChakraLink
                as={Link}
                to="#"
                color="gray.600"
                _hover={{ color: "teal.500" }}
                _dark={{ color: "gray.300", _hover: { color: "teal.400" } }}
              >
                Terms of Service
              </ChakraLink>
              <ChakraLink
                as={Link}
                to="#"
                color="gray.600"
                _hover={{ color: "teal.500" }}
                _dark={{ color: "gray.300", _hover: { color: "teal.400" } }}
              >
                Privacy Policy
              </ChakraLink>
              <ChakraLink
                as={Link}
                to="#"
                color="gray.600"
                _hover={{ color: "teal.500" }}
                _dark={{ color: "gray.300", _hover: { color: "teal.400" } }}
              >
                Contact
              </ChakraLink>
            </Flex>
          </Flex>
          <Text
            mt={8}
            textAlign="center"
            color="gray.500"
            _dark={{ color: "gray.400" }}
            fontSize="sm"
          >
            © {new Date().getFullYear()} Playlist Converter. All rights
            reserved.
          </Text>
        </Container>
      </Box>
    </Box>
  );
  // return (
  //   <div className="min-h-screen bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
  //     <header className="container mx-auto px-4 py-6 flex items-center justify-between">
  //       <div className="flex items-center space-x-3">
  //         <Music className="w-8 h-8 text-teal-500 dark:text-teal-400" />
  //         <span className="text-2xl font-bold text-gray-800 dark:text-white">
  //           Playlist Converter
  //         </span>
  //       </div>
  //       <nav className="hidden md:flex space-x-6">
  //         <Link
  //           to="#features"
  //           className="text-gray-600 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
  //         >
  //           Features
  //         </Link>
  //         <Link
  //           to="#how-it-works"
  //           className="text-gray-600 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
  //         >
  //           How It Works
  //         </Link>
  //         <Link
  //           to="#"
  //           className="text-gray-600 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
  //         >
  //           About
  //         </Link>
  //       </nav>
  //       <Button className="bg-teal-500 hover:bg-teal-600 text-white">
  //         Get Started
  //       </Button>
  //     </header>

  //     <main>
  //       <section className="container mx-auto px-4 py-20 text-center">
  //         <h1 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-white mb-6">
  //           Convert Your Playlists{" "}
  //           <span className="text-teal-500 dark:text-teal-400">Seamlessly</span>
  //         </h1>
  //         <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
  //           Switch between music platforms without losing your carefully curated
  //           playlists. Fast, easy, and free.
  //         </p>
  //         <div className="flex justify-center space-x-4">
  //           <Button className="bg-teal-500 hover:bg-teal-600 text-white text-lg px-8 py-3">
  //             Start Converting
  //             <ArrowRight className="ml-2 h-5 w-5" />
  //           </Button>
  //           <Button
  //             variant="outline"
  //             className="text-teal-500 border-teal-500 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-900/30 text-lg px-8 py-3"
  //           >
  //             Learn More
  //           </Button>
  //         </div>
  //       </section>

  //       <section id="features" className="bg-white dark:bg-gray-800 py-20">
  //         <div className="container mx-auto px-4">
  //           <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12">
  //             Why Choose Us?
  //           </h2>
  //           <div className="grid md:grid-cols-3 gap-8">
  //             {[
  //               {
  //                 icon: Zap,
  //                 title: "Lightning Fast",
  //                 description:
  //                   "Convert your playlists in seconds, not minutes.",
  //               },
  //               {
  //                 icon: Repeat,
  //                 title: "Multiple Platforms",
  //                 description:
  //                   "Support for all major music streaming services.",
  //               },
  //               {
  //                 icon: CheckCircle,
  //                 title: "100% Accurate",
  //                 description:
  //                   "Our smart matching ensures you don't lose any tracks.",
  //               },
  //             ].map((feature, index) => (
  //               <div
  //                 key={index}
  //                 className="bg-teal-50 dark:bg-teal-900/30 rounded-xl p-6 text-center"
  //               >
  //                 <feature.icon className="w-12 h-12 text-teal-500 dark:text-teal-400 mx-auto mb-4" />
  //                 <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
  //                   {feature.title}
  //                 </h3>
  //                 <p className="text-gray-600 dark:text-gray-300">
  //                   {feature.description}
  //                 </p>
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       </section>

  //       <section id="how-it-works" className="py-20">
  //         <div className="container mx-auto px-4">
  //           <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12">
  //             How It Works
  //           </h2>
  //           <div className="grid md:grid-cols-3 gap-8">
  //             {[
  //               {
  //                 step: 1,
  //                 title: "Select Platforms",
  //                 description:
  //                   "Choose your source and destination music platforms.",
  //               },
  //               {
  //                 step: 2,
  //                 title: "Pick Playlists",
  //                 description: "Select the playlists you want to transfer.",
  //               },
  //               {
  //                 step: 3,
  //                 title: "Convert & Enjoy",
  //                 description:
  //                   "Let our app do the magic and enjoy your music anywhere.",
  //               },
  //             ].map((step, index) => (
  //               <div
  //                 key={index}
  //                 className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
  //               >
  //                 <div className="bg-teal-500 text-white rounded-full w-10 h-10 flex items-center justify-center mb-4 text-xl font-bold">
  //                   {step.step}
  //                 </div>
  //                 <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
  //                   {step.title}
  //                 </h3>
  //                 <p className="text-gray-600 dark:text-gray-300">
  //                   {step.description}
  //                 </p>
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       </section>

  //       <section className="bg-teal-500 dark:bg-teal-600 py-20 text-white">
  //         <div className="container mx-auto px-4 text-center">
  //           <h2 className="text-3xl md:text-4xl font-bold mb-6">
  //             Ready to Convert Your Playlists?
  //           </h2>
  //           <p className="text-xl mb-8 max-w-2xl mx-auto">
  //             Join thousands of music lovers who have already made the switch.
  //             Try our playlist converter now!
  //           </p>
  //           <div className="max-w-md mx-auto">
  //             <form className="flex space-x-2">
  //               <Input
  //                 type="email"
  //                 placeholder="Enter your email"
  //                 className="flex-grow bg-white/20 border-white/30 text-white placeholder-white/70 focus:ring-white"
  //               />
  //               <Button
  //                 type="submit"
  //                 className="bg-white text-teal-500 hover:bg-teal-50"
  //               >
  //                 Get Started
  //                 <ArrowRight className="ml-2 h-4 w-4" />
  //               </Button>
  //             </form>
  //             <p className="text-sm mt-4">
  //               By signing up, you agree to our Terms & Conditions and Privacy
  //               Policy.
  //             </p>
  //           </div>
  //         </div>
  //       </section>
  //     </main>

  //     <footer className="bg-white dark:bg-gray-800 py-8">
  //       <div className="container mx-auto px-4">
  //         <div className="flex flex-col md:flex-row justify-between items-center">
  //           <div className="flex items-center space-x-3 mb-4 md:mb-0">
  //             <Music className="w-6 h-6 text-teal-500 dark:text-teal-400" />
  //             <span className="text-xl font-bold text-gray-800 dark:text-white">
  //               Playlist Converter
  //             </span>
  //           </div>
  //           <nav className="flex space-x-6">
  //             <Link
  //               to="#"
  //               className="text-gray-600 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
  //             >
  //               Terms of Service
  //             </Link>
  //             <Link
  //               to="#"
  //               className="text-gray-600 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
  //             >
  //               Privacy Policy
  //             </Link>
  //             <Link
  //               to="#"
  //               className="text-gray-600 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
  //             >
  //               Contact
  //             </Link>
  //           </nav>
  //         </div>
  //         <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
  //           © {new Date().getFullYear()} Playlist Converter. All rights
  //           reserved.
  //         </div>
  //       </div>
  //     </footer>
  //   </div>
  // );
}
