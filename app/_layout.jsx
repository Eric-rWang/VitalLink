import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from "expo-router";
import React, { useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from "../constants/theme";

// ScreenContainer: hides children until the view has laid out and a short
// delay passes, then fades them in. Keeps the Animated.Value stable across renders.
export function ScreenContainer({ children, style, delay = 80, fade = 180 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ready = useRef(false);

  const onLayout = () => {
    if (ready.current) return;
    ready.current = true;
    setTimeout(() => {
      Animated.timing(opacity, { toValue: 1, duration: fade, useNativeDriver: true }).start();
    }, delay);
  };

  return (
    <Animated.View style={[style, { opacity }]} onLayout={onLayout}>
      {children}
    </Animated.View>
  );
}

const RootLayout = () => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#eaf6ff", "#1b2940", "#071018"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { top: -insets.top, bottom: -insets.bottom }]}
      />
      <Stack
        initialRouteName="splash"
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontSize: 18, fontWeight: "700" },
          // make content transparent so gradient shows through; add top padding for safe area
          contentStyle: { paddingHorizontal: 16, paddingTop: insets.top + 20, backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ title: "", headerShown: false }} />
        <Stack.Screen
          name="devices"
          options={{
            title: 'Devices',
            headerStyle: { backgroundColor: 'transparent' },
            headerTransparent: true,
            headerShadowVisible: false,
            contentStyle: { paddingHorizontal: 16, paddingTop: insets.top + 20, backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen
          name="stream"
          options={{
            title: 'Live Stream',
            headerStyle: { backgroundColor: 'transparent' },
            headerTransparent: true,
            headerShadowVisible: false,
            contentStyle: { paddingHorizontal: 16, paddingTop: insets.top + 20, backgroundColor: 'transparent' },
          }}
        />
      </Stack>
    </View>
  );
};

const styles = StyleSheet.create({ root: { flex: 1 } });

export default RootLayout;