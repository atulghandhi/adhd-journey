import Svg, { Path } from "react-native-svg";

interface NextThingLogoProps {
  color?: string;
  size?: number;
}

export function NextThingLogo({
  color = "#1B4332",
  size = 48,
}: NextThingLogoProps) {
  return (
    <Svg viewBox="0 0 512 512" width={size} height={size} fill="none">
      {/* Center leaf */}
      <Path
        d="M256 80 C256 80 310 180 310 280 C310 340 286 380 256 400 C226 380 202 340 202 280 C202 180 256 80 256 80Z"
        fill={color}
      />
      {/* Left leaf */}
      <Path
        d="M230 400 C230 400 140 340 110 250 C90 190 100 140 130 120 C155 140 175 180 185 240 C200 320 230 400 230 400Z"
        fill={color}
      />
      {/* Right leaf */}
      <Path
        d="M282 400 C282 400 372 340 402 250 C422 190 412 140 382 120 C357 140 337 180 327 240 C312 320 282 400 282 400Z"
        fill={color}
      />
    </Svg>
  );
}
