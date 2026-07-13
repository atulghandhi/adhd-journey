import { Image } from "react-native";

interface NextThingLogoProps {
  size?: number;
}

export function NextThingLogo({ size = 48 }: NextThingLogoProps) {
  return (
    <Image
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- React Native static assets must use require()
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
