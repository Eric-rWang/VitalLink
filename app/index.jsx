import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from "../constants/theme";

const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#eaf6ff", "#1b2940", "#071018"]} // brighter light at top -> dark at bottom
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        // expand beyond router content padding and safe area so the gradient fills the full device
        style={[StyleSheet.absoluteFill, { top: -insets.top - 16, left: -insets.left - 16, right: -insets.right - 16, bottom: -insets.bottom - 16 }]}
      />
      <StatusBar style="dark" />
  <View style={[styles.content, { height: '40%', justifyContent: 'flex-start', paddingTop: insets.top + 160 }]}>
        <Text style={styles.title}>Vitals</Text>
        <Text style={styles.subtitle}>Connect a supported sensor to start streaming.</Text>
        <TouchableOpacity onPress={() => router.push('/devices')} activeOpacity={0.9}>
          <LinearGradient colors={["#34d399", "#22c55e", "#16a34a"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.button}>
            <Text style={styles.buttonText}>Select Device</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg },
  title: { fontSize: 34, fontWeight: '800', marginBottom: spacing.sm, color: colors.textPrimary },
  subtitle: { textAlign: 'center', color: colors.textSecondary, marginBottom: spacing.lg },
  button: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.md },
  buttonText: { color: '#000', fontWeight: '700' },
  text: {
    fontSize: 18,
  },
});

export default HomeScreen;