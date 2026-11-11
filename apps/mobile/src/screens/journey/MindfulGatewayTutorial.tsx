import { SafeAreaView, ScrollView } from "../../components/primitives";
import { AppDisruptSettings } from "../gateway/AppDisruptSettings";

/** The journey's App Disrupt screen: the same setup as the settings route. */
export function MindfulGatewayTutorial() {
  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <AppDisruptSettings />
      </ScrollView>
    </SafeAreaView>
  );
}
