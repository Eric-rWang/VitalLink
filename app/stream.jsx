import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';
import CollapsibleSection from '../components/CollapsibleSection';
import WaveformChart from '../components/WaveformChart';
import { DEVICE_WHITELIST, getDeviceById } from '../constants/bleDevices';
import { colors, radius, spacing } from '../constants/theme';
import { BLEClient } from '../lib/bleClient';
import { getParser } from '../lib/parser';
import { ScreenContainer } from './_layout';

function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

import * as FileSystem from 'expo-file-system';
export default function StreamScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const ble = useMemo(() => new BLEClient(), []);
  const unsubRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [lastHex, setLastHex] = useState('');
  const [packets, setPackets] = useState(0);
  const [parsed, setParsed] = useState(null);
  const [wave, setWave] = useState([]);
  const waveBufRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const recordHeaderRef = useRef(null); // string[]
  const recordRowsRef = useRef([]); // string[] of csv lines
  const recordingRef = useRef(recording);
  const [lastSavedPath, setLastSavedPath] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [saveDir, setSaveDir] = useState(null); // { type: 'app' } or { type: 'android-saf', uri }
  const [saveDirLabel, setSaveDirLabel] = useState('App Documents');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setStatus('connecting');
        // Map route params to whitelist device entry if available
        const wl = DEVICE_WHITELIST.find((d) => d.name === params.name) || getDeviceById(params.deviceId);
        const mtu = wl?.desiredMTU;
        const parser = getParser(wl?.parserId);
        const { unsubscribe } = await ble.connectAndSubscribe({ id: params.deviceId, name: params.name }, {
          mtu,
          onData: (bytes) => {
            if (!mounted) return;
            // bytes is Uint8Array from client
            setPackets((p) => p + 1);
            const hex = bytesToHex(bytes);
            setLastHex(hex);
            try {
              const out = parser ? parser(bytes) : null;
              setParsed(out);
              if (out && typeof out.value === 'number') {
                // maintain a rolling buffer of samples for the chart
                const buf = waveBufRef.current.slice();
                buf.push(out.value);
                const maxPoints = 360; // ~3.6s at 100 Hz visualized
                if (buf.length > maxPoints) buf.splice(0, buf.length - maxPoints);
                waveBufRef.current = buf;
                setWave(buf);
              }
              // recording buffer
              if (recording) {
                const now = Date.now();
                const sampleObj = out && typeof out === 'object' ? out : { value: out };
                if (!recordHeaderRef.current) {
                  const keys = Object.keys(sampleObj || {});
                  recordHeaderRef.current = ['time_ms', ...keys];
                  recordRowsRef.current.push(recordHeaderRef.current.join(','));
                }
                const cols = recordHeaderRef.current;
                const row = [String(now), ...cols.slice(1).map(k => safeCSV(sampleObj?.[k]))].join(',');
                recordRowsRef.current.push(row);
              }
            } catch { /* ignore */ }
          },
        });
        unsubRef.current = unsubscribe;
        // listen for disconnect events from the BLE client and notify the user
        const off = ble.on('disconnect', async (info) => {
          try {
            // If we were recording, save and stop recording first
            if (recordingRef.current) {
              try { await stopRecording(); } catch (e) { console.warn('Failed to save on disconnect', e); }
            }
            // If this disconnect was initiated manually (e.g. user navigated away),
            // don't show the alert or auto-navigate — just update status.
            if (info && info.reason === 'manual') {
              setStatus('disconnected');
              return;
            }
            // vibrate briefly on supported platforms
            try { Vibration.vibrate(500); } catch {}
            Alert.alert('Disconnected', 'The connection to the device was lost.');
            setStatus('disconnected');
            try { router.push('/devices'); } catch (e) { console.warn('Navigation on disconnect failed', e); }
          } catch (e) { console.warn('Disconnect handler error', e); }
        });
        setStatus('streaming');
      } catch (e) {
        console.warn('Connect/subscribe error', e);
        setStatus('error');
      }
  })();
  return () => { mounted = false; unsubRef.current?.(); ble.disconnect(); try { off && off(); } catch {} };
  }, [ble, params.deviceId, params.name]);

  const openNameModal = () => {
    // suggest default name
    const nameSafe = String(params.name || 'device').replace(/[^a-z0-9_-]/gi, '_');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    setFileName(`${nameSafe}_${ts}`);
    if (!saveDir) {
      // default to app documents
      setSaveDir({ type: 'app' });
      setSaveDirLabel('App Documents');
    }
    setShowNameModal(true);
  };

  const startRecording = () => {
    setShowNameModal(false);
    setLastSavedPath(null);
    recordHeaderRef.current = null;
    recordRowsRef.current = [];
    setRecording(true);
  };

  // keep a ref of current recording state for async handlers
  useEffect(() => { recordingRef.current = recording; }, [recording]);

  const stopRecording = async () => {
    setRecording(false);
    try {
      const base = sanitizeBaseName(fileName || (params.name || 'device'));
      const filename = base.toLowerCase().endsWith('.csv') ? base : `${base}.csv`;
      const content = recordRowsRef.current.join('\n');
      let savedPath = null;
      if (saveDir?.type === 'android-saf' && Platform.OS === 'android') {
        const SAF = FileSystem.StorageAccessFramework;
        let targetDir = saveDir.uri;
        // Ensure 'data' subdir exists (create or find)
        try {
          targetDir = await SAF.createDirectoryAsync(targetDir, 'data');
        } catch (e) {
          try {
            const children = await SAF.readDirectoryAsync(saveDir.uri);
            const existing = children.find((u) => /(^|\/)data(\/.+)?$/i.test(u));
            if (existing) targetDir = existing;
          } catch {}
        }
        const fileUri = await SAF.createFileAsync(targetDir, filename, 'text/csv');
        await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
        savedPath = fileUri;
      } else {
        // App documents default
        const baseDir = FileSystem.documentDirectory + 'data/';
        await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
        const path = baseDir + filename;
        await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
        savedPath = path;
      }
      setLastSavedPath(savedPath);
    } catch (e) {
      console.warn('Failed to save CSV', e);
    }
  };

  function sanitizeBaseName(s) {
    return String(s).trim().replace(/[^a-z0-9._-]/gi, '_');
  }

  async function chooseFolder() {
    try {
      if (Platform.OS === 'android') {
        const SAF = FileSystem.StorageAccessFramework;
        if (!SAF || !SAF.requestDirectoryPermissionsAsync) {
          Alert.alert('Not supported', 'This device does not support folder selection via SAF. Files will be saved to the app Documents folder instead.');
          setSaveDir({ type: 'app' });
          setSaveDirLabel('App Documents');
          return;
        }
        const perm = await SAF.requestDirectoryPermissionsAsync();
        // Some SDKs return { granted, directoryUri } and some return { granted }
        const granted = perm && (perm.granted === true || perm.granted === 'granted');
        const uri = perm && (perm.directoryUri || perm.directoryURI || perm.uri);
        if (granted && uri) {
          setSaveDir({ type: 'android-saf', uri });
          setSaveDirLabel('Android SAF');
          Alert.alert('Folder selected', 'Files will be written to the selected folder.');
        } else if (granted && !uri) {
          // permission granted but no uri returned (older SDKs) — fallback to app dir
          setSaveDir({ type: 'app' });
          setSaveDirLabel('App Documents');
          Alert.alert('Selected', 'Permission granted but no folder returned. Files will be saved to the app Documents folder.');
        } else {
          Alert.alert('Permission required', 'Permission to access a folder was not granted. Files will be saved to the app Documents folder.');
          setSaveDir({ type: 'app' });
          setSaveDirLabel('App Documents');
        }
      } else {
        // iOS: sandboxed; there is no general folder picker. Use app Documents and explain to user.
        const baseDir = FileSystem.documentDirectory + 'data/';
        try { await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true }); } catch {}
        setSaveDir({ type: 'app' });
        setSaveDirLabel('App Documents');
        Alert.alert('iOS location', 'iOS does not allow selecting arbitrary folders. Files will be saved to the app Documents/data folder. You can export the file after recording.');
      }
    } catch (e) {
      console.warn('Folder selection failed', e);
      Alert.alert('Error', String(e?.message || e));
      setSaveDir({ type: 'app' });
      setSaveDirLabel('App Documents');
    }
  }

  return (
    <ScreenContainer style={styles.container}>
      <Modal visible={showNameModal} animationType="fade" transparent onRequestClose={() => setShowNameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Name your recording</Text>
            <TextInput value={fileName} onChangeText={setFileName} placeholder="filename" placeholderTextColor={colors.textSecondary}
              style={styles.input} autoFocus returnKeyType="done" onSubmitEditing={startRecording} />
            <View style={styles.dirRow}>
              <Text style={styles.dirText}>Save to: {saveDirLabel}</Text>
              <TouchableOpacity onPress={chooseFolder} style={[styles.modalBtn, styles.okBtn]}>
                <Text style={[styles.modalBtnText, { color: '#000' }]}>Choose Folder</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => setShowNameModal(false)} style={[styles.modalBtn, styles.cancelBtn]}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={startRecording} style={[styles.modalBtn, styles.okBtn]}>
                <Text style={[styles.modalBtnText, { color: '#000' }]}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Text style={styles.header}>Device: {params.name}</Text>
      <View style={styles.topRow}>
        <Text style={styles.meta}>Status: {status} • Packets: {packets}</Text>
  <TouchableOpacity onPress={recording ? stopRecording : openNameModal} style={[styles.recBtn, recording ? styles.recStop : styles.recStart]}>
          <Text style={styles.recText}>{recording ? 'Stop' : 'Record'}</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.window, { marginBottom: spacing.md }]}> 
        <CollapsibleSection title="Waveform" defaultExpanded>
          <WaveformChart data={wave} height={160} color={params.name?.includes('PPG') ? colors.accentBlue : colors.accentGreen} background="transparent" yRange={[0, 1023]} />
        </CollapsibleSection>
      </View>
      <View style={styles.window}>
        <CollapsibleSection title="Raw (hex)" defaultExpanded={false}>
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 12 }}>
            <Text selectable style={styles.mono}>{lastHex}</Text>
          </ScrollView>
        </CollapsibleSection>
      </View>
      <View style={[styles.window, { marginTop: spacing.md }]}> 
        <CollapsibleSection title="Parsed" defaultExpanded={false}>
          <ScrollView style={styles.scroll}>
            <Text style={styles.code}>{parsed ? JSON.stringify(parsed, null, 2) : 'No parser or no data yet.'}</Text>
            {lastSavedPath ? <Text style={[styles.code, { marginTop: 8, color: colors.accentBlue }]}>Saved: {lastSavedPath}</Text> : null}
          </ScrollView>
        </CollapsibleSection>
      </View>
  </ScreenContainer>
  );
}

function safeCSV(v) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const styles = StyleSheet.create({
  // add extra top padding so content sits further below the header
  container: { flex: 1, backgroundColor: 'transparent', padding: spacing.md, paddingTop: spacing.md + 20 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.textPrimary },
  meta: { color: colors.accentBlue },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  window: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.divider, borderRadius: radius.md, padding: spacing.md, backgroundColor: 'rgba(28,28,30,0.7)' },
  label: { fontWeight: '700', marginBottom: 6, color: colors.textSecondary },
  scroll: { maxHeight: 180 },
  mono: { color: colors.textPrimary, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12, lineHeight: 18 },
  code: { color: colors.textPrimary, fontSize: 12, lineHeight: 18 },
  recBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm },
  recStart: { backgroundColor: colors.accentRed },
  recStop: { backgroundColor: colors.accentBlue },
  recText: { color: '#000', fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '86%', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.divider },
  modalTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginBottom: spacing.sm },
  input: { backgroundColor: '#111', color: colors.textPrimary, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.divider },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm },
  cancelBtn: { backgroundColor: colors.card },
  okBtn: { backgroundColor: colors.accentGreen },
  modalBtnText: { color: colors.textPrimary, fontWeight: '700' },
  dirRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  dirText: { color: colors.textSecondary },
});

