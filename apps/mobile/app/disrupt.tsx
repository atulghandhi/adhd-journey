import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { DisruptScreen } from "../src/screens/disrupt/DisruptScreen";

export default function DisruptRoute() {
  return (
    <ErrorBoundary>
      <DisruptScreen />
    </ErrorBoundary>
  );
}
