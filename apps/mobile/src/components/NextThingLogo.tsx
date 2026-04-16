import { Image } from "react-native";

interface NextThingLogoProps {
  size?: number;
}

export function NextThingLogo({ size = 48 }: NextThingLogoProps) {
  return (
    <Image
      source={require("../../assets/icon.png")}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
      }}
      resizeMode="contain"
    />
  );
}
