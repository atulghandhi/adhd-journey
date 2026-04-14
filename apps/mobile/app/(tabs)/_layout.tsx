import { Tabs } from "expo-router";
import { BarChart2, Compass, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { TabBarButton } from "../../src/components/TabBarButton";

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: isDark ? "#0F1A14" : "#F0FFF4",
        },
        tabBarActiveTintColor: "#40916C",
        tabBarInactiveTintColor: isDark ? "#2D6A4F" : "#B7E4C7",
        tabBarStyle: {
          backgroundColor: isDark ? "#1A2E23" : "#FFFFFF",
          borderTopColor: isDark ? "#2D6A4F" : "#D8F3DC",
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarButton: (props) => <TabBarButton {...props} />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="journey"
        options={{
          tabBarIcon: ({ color }) => <Compass color={color} size={20} />,
          title: "Journey",
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ color }) => <BarChart2 color={color} size={20} />,
          title: "Progress",
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={20} />,
          title: "Account",
        }}
      />
    </Tabs>
  );
}
