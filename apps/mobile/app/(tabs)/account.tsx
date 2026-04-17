import { ErrorBoundary } from "../../src/components/ErrorBoundary";
import { AccountScreen } from "../../src/screens/account/AccountScreen";

export default function AccountRoute() {
  return (
    <ErrorBoundary>
      <AccountScreen />
    </ErrorBoundary>
  );
}
