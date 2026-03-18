import { Redirect } from "expo-router";

import { useAuth } from "../src/hooks/useAuth";
import { useProfile } from "../src/hooks/useProfile";
import { BootstrapScreen } from "../src/screens/BootstrapScreen";

export default function IndexRoute() {
  const { isLoading, session } = useAuth();
  const profileQuery = useProfile();

  if (isLoading || (session && profileQuery.isLoading)) {
    return <BootstrapScreen />;
  }

  if (!session) {
    return <Redirect href={"/auth/login" as never} />;
  }

  if (!profileQuery.data?.onboarding_complete) {
    return <Redirect href={"/onboarding/welcome" as never} />;
  }

  return <Redirect href={"/journey" as never} />;
}
