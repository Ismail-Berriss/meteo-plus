import onboardingPlaceholder from "@/assets/images/onboarding-placeholder.jpg";
import morning from "@/assets/images/morning.jpg";

import onb1 from "@/assets/images/onb1.png";
import onb2 from "@/assets/images/onb2.png";
import onb3 from "@/assets/images/onb3.png";
import onb4 from "@/assets/images/onb4.png";

export const images = {
  onboardingPlaceholder,
  morning,
  onb1,
  onb2,
  onb3,
  onb4,
};

export const onboarding = [
  {
    id: 1,
    title: "Welcome to MétéoPlus",
    description:
      "Your personalized weather companion! Get accurate weather updates, clothing recommendations, and more—all in one place.",
    image: images.onb1,
  },
  {
    id: 2,
    title: "Plan Your Day with Confidence",
    description:
      "Receive real-time weather updates and alerts via SMS and notifications. Stay informed about sudden weather changes, no matter where you are!",
    image: images.onb2,
  },
  {
    id: 3,
    title: "Weather at Your Fingertips",
    description:
      "Enable location services to get personalized weather updates and alerts specific to your area. No manual searches needed!",
    image: images.onb3,
  },
  {
    id: 4,
    title: "Engaging Weather Experience",
    description:
      "Enjoy dynamic backgrounds that match the current weather and a voice assistant to guide your wardrobe choices based on the forecast.",
    image: images.onb4,
  },
];
