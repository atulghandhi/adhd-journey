import { ErrorBoundary } from "../../src/components/ErrorBoundary";
import { ProgressScreen } from "../../src/screens/progress/ProgressScreen";

export default function ProgressRoute() {
  return (
    <ErrorBoundary>
      <ProgressScreen />
    </ErrorBoundary>
  );
}
