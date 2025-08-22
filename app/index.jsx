import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

const HomeScreen = () => {
  const router = useRouter();
  return (
    <LinearGradient colors={["#0b0b0b", "#0e1225", "#0b0b0b"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.container}>
      <Text style={styles.title}>Vitals</Text>
      <Text style={styles.subtitle}>Connect a supported sensor to start streaming.</Text>
      <TouchableOpacity onPress={() => router.push('/devices')} activeOpacity={0.9}>
        <LinearGradient colors={["#34d399", "#22c55e", "#16a34a"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.button}>
          <Text style={styles.buttonText}>Select Device</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  title: { fontSize: 34, fontWeight: '800', marginBottom: spacing.sm, color: colors.textPrimary },
  subtitle: { textAlign: 'center', color: colors.textSecondary, marginBottom: spacing.lg },
  button: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.md },
  buttonText: { color: '#000', fontWeight: '700' },
  text: {
    fontSize: 18,
  },
});

export default HomeScreen;