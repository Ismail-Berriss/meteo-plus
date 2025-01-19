import morning from "@/assets/images/morning.jpg";
import morning_list from "@/assets/images/morning_list.jpg";

import onb1 from "@/assets/images/onb1.png";
import onb2 from "@/assets/images/onb2.png";
import onb3 from "@/assets/images/onb3.png";
import onb4 from "@/assets/images/onb4.png";

import cloud from "@/assets/images/cloud.png";
import emptyStar from "@/assets/images/emptyStar.png";
import fullStar from "@/assets/images/fullStar.png";
import heavyrain from "@/assets/images/heavyrain.png";
import mist from "@/assets/images/mist.png";
import moderaterain from "@/assets/images/moderaterain.png";
import partlycloudy from "@/assets/images/partlycloudy.png";
import sun from "@/assets/images/sun.png";

export const images = {
  onb1,
  onb2,
  onb3,
  onb4,
  morning,
  morning_list,
  cloud,
  emptyStar,
  fullStar,
  heavyrain,
  mist,
  moderaterain,
  partlycloudy,
  sun,
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
