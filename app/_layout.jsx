import { Stack } from "expo-router";
import { colors } from "../constants/theme";

const RootLayout = () => {
  return (
    <Stack
      initialRouteName="splash"
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontSize: 18, fontWeight: "700" },
        contentStyle: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: "", headerShown: false }} />
      <Stack.Screen name="devices" options={{ title: "Devices" }} />
      <Stack.Screen name="stream" options={{ title: "Live Stream" }} />
    </Stack>
  );
};

export default RootLayout;