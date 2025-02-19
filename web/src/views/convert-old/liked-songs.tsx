import { useState } from "react";
import { Button, Select, Card } from "@mantine/core";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Progress } from "~/components/ui/progress";
import { Heart, ArrowRight, Music, CheckCircle } from "lucide-react";

// Custom Stepper component
const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="flex justify-between mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index <= currentStep
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {index + 1}
          </div>
          <span
            className={`mt-2 text-sm ${
              index <= currentStep ? "text-blue-500" : "text-gray-500"
            }`}
          >
            {step}
          </span>
        </div>
      ))}
    </div>
  );
};

const musicPlatforms = [
  { name: "Spotify", logo: "/spotify-logo.png" },
  { name: "Apple Music", logo: "/apple-music-logo.png" },
  { name: "YouTube Music", logo: "/youtube-music-logo.png" },
];

export default function ConvertLikedSongs() {
  const [step, setStep] = useState(0);
  const [sourcePlatform, setSourcePlatform] = useState("");
  const [destinationPlatform, setDestinationPlatform] = useState("");
  const [conversionProgress, setConversionProgress] = useState(0);

  const steps = ["Select Source", "Select Destination", "Convert", "Complete"];

  const handleStartConversion = () => {
    setStep(2);
    // Simulating conversion progress
    const interval = setInterval(() => {
      setConversionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep(3);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-100 dark:from-gray-900 dark:to-purple-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Convert Your Liked Songs
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Transfer your favorite tracks between music platforms in just a few
            steps.
          </p>
        </header>

        <Stepper steps={steps} currentStep={step} />

        <Card className="mb-8">
          <CardContent className="pt-6">
            {step === 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Select Source Platform
                </h2>
                <Select onValueChange={setSourcePlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your source platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {musicPlatforms.map((platform) => (
                      <SelectItem key={platform.name} value={platform.name}>
                        <div className="flex items-center">
                          <img
                            src={platform.logo}
                            alt={platform.name}
                            width={24}
                            height={24}
                            className="mr-2"
                          />
                          {platform.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="mt-4 w-full"
                  onClick={() => setStep(1)}
                  disabled={!sourcePlatform}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Select Destination Platform
                </h2>
                <Select onValueChange={setDestinationPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your destination platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {musicPlatforms
                      .filter((platform) => platform.name !== sourcePlatform)
                      .map((platform) => (
                        <SelectItem key={platform.name} value={platform.name}>
                          <div className="flex items-center">
                            <img
                              src={platform.logo}
                              alt={platform.name}
                              width={24}
                              height={24}
                              className="mr-2"
                            />
                            {platform.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleStartConversion}
                    disabled={!destinationPlatform}
                  >
                    Start Conversion
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Converting Your Liked Songs
                </h2>
                <div className="flex justify-between mb-2">
                  <span>Progress</span>
                  <span>{conversionProgress}%</span>
                </div>
                <Progress value={conversionProgress} className="mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we transfer your liked songs from{" "}
                  {sourcePlatform} to {destinationPlatform}. This may take a few
                  minutes depending on the number of songs.
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">
                  Conversion Complete!
                </h2>
                <p className="mb-4">
                  Your liked songs have been successfully transferred from{" "}
                  {sourcePlatform} to {destinationPlatform}.
                </p>
                <Button onClick={() => setStep(0)}>Convert More Songs</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {step < 3 && (
          <Card>
            <CardHeader>
              <CardTitle>What to Expect</CardTitle>
              <CardDescription>
                Here's what happens during the conversion process:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                <li>We retrieve your liked songs from the source platform.</li>
                <li>
                  Each song is matched to its equivalent on the destination
                  platform.
                </li>
                <li>
                  Matched songs are added to your liked songs or a new playlist
                  on the destination platform.
                </li>
                <li>
                  You'll receive a summary of transferred and any unmatched
                  songs.
                </li>
              </ol>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Note: Some songs may not be available on the destination
                platform due to licensing restrictions.
              </p>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
