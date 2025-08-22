import { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Switch, Text, UIManager, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CollapsibleSection({ title, children, defaultExpanded = true, style }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  useEffect(() => { setExpanded(defaultExpanded); }, [defaultExpanded]);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  };

  return (
    <View style={style}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Switch
          value={expanded}
          onValueChange={toggle}
          style={styles.switch}
          ios_backgroundColor="#4B5563"
          trackColor={{ false: '#4B5563', true: '#9CA3AF' }}
          thumbColor={Platform.OS === 'android' ? '#D1D5DB' : undefined}
        />
      </View>
      {expanded ? <View style={{ marginTop: spacing.sm }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textSecondary, fontWeight: '700' },
  switch: { transform: [{ scale: 0.8 }] },
});
