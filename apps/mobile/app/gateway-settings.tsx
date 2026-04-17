import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { GatewaySettingsScreen } from "../src/screens/gateway/GatewaySettingsScreen";

export default function GatewaySettingsRoute() {
  return (
    <ErrorBoundary>
      <GatewaySettingsScreen />
    </ErrorBoundary>
  );
}
