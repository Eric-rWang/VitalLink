import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DEVICE_WHITELIST } from '../constants/bleDevices';
import { colors, radius, spacing } from '../constants/theme';
import { BLEClient } from '../lib/bleClient';

export default function DevicesScreen() {
  const router = useRouter();
  const ble = useMemo(() => new BLEClient(), []);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const found = await ble.scanWhitelist(6000);
        if (!mounted) return;
        // Filter to whitelist & unique by name
        const whitelistNames = new Set(DEVICE_WHITELIST.map((d) => d.name));
        const filtered = found.filter((d) => whitelistNames.has(d.name));
        const uniqueByName = Array.from(new Map(filtered.map((d) => [d.name, d])).values());
        setDevices(uniqueByName);
      } catch (e) {
        console.warn('Scan error', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [ble]);

  const onSelect = (device) => {
    router.push({ pathname: '/stream', params: { deviceId: device.id, name: device.name } });
  };

  if (loading) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator size="large" color={colors.accentGreen} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Scanning for devices…</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      data={devices}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={{ color: colors.textSecondary }}>No whitelisted devices found. Ensure the device is on and nearby.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onSelect(item)} style={styles.item}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.sub}>ID: {item.id}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  list: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  item: { padding: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.divider },
  title: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  sub: { color: colors.textSecondary, marginTop: 4 },
});
