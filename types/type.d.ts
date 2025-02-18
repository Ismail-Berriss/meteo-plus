import { TouchableOpacityProps } from "react-native";

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
}

interface WeatherForecast {
  day: string;
  high: number;
  low: number;
  dayNumber: number;
  monthNumber: number;
  phrase: string;
}

interface WeatherInfo {
  name: string;
  country: string;
  type: string;
  temperature: number;
  weatherText: string;
  windSpeed: number;
  humidity: number;
  realFeel: number;
  windDirection: string;
}
