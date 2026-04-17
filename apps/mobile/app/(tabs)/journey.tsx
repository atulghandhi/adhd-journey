import { ErrorBoundary } from "../../src/components/ErrorBoundary";
import { JourneyScreen } from "../../src/screens/journey/JourneyScreen";

export default function JourneyRoute() {
  return (
    <ErrorBoundary>
      <JourneyScreen />
    </ErrorBoundary>
  );
}
