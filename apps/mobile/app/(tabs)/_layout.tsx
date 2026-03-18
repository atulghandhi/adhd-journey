import { Tabs } from "expo-router";
import { BarChart2, Compass, MessageCircle, User } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: "#F0FFF4",
        },
        tabBarActiveTintColor: "#40916C",
        tabBarInactiveTintColor: "#B7E4C7",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#D8F3DC",
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
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
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={20} />,
          title: "Community",
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
