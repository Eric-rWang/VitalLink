// Parser registry that converts raw Uint8Array packets to human-friendly objects.
// Developer: register your own parser under a unique ID and reference it from devices.

const registry = new Map();

export function registerParser(id, parser) {
  registry.set(id, parser);
}

export function getParser(id) {
  return registry.get(id) || registry.get('default');
}

// Default parser: returns hex string and byte length.
registerParser('default', (bytes) => {
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ');
  return { hex, length: bytes.length };
});

// Dummy device parser (example structure):
// [0xAA][0x55][seq:1][tsMs:4 little][value:2 little][crc:1]
registerParser('dummy-v1', (bytes) => {
  const view = bytes;
  if (view.length < 10) return { error: 'short', length: view.length };
  const magic = view[0] === 0xaa && view[1] === 0x55;
  const seq = view[2];
  const ts = view[3] | (view[4] << 8) | (view[5] << 16) | (view[6] << 24);
  const val = view[7] | (view[8] << 8);
  const crc = view[9];
  return { magic, seq, ts, value: val, crc };
});

// Waveform packets (ECG/PPG): assume [value:2 little]
registerParser('wave-ecg', (bytes) => {
  if (bytes.length < 2) return { value: 0 };
  const v = bytes[0] | (bytes[1] << 8);
  return { value: v };
});

registerParser('wave-ppg', (bytes) => {
  if (bytes.length < 2) return { value: 0 };
  const v = bytes[0] | (bytes[1] << 8);
  return { value: v };
});

// Example custom parser for a user-defined packet structure (uncomment and adapt):
// registerParser('my-sensor-v1', (bytes) => {
//   // Contract example:
//   // [0xAA][0x55][seq:1][temp:2 little][hr:1][crc:1]
//   if (bytes.length < 7) return { error: 'short packet', length: bytes.length };
//   const magic = bytes[0] === 0xaa && bytes[1] === 0x55;
//   const seq = bytes[2];
//   const tempRaw = bytes[3] | (bytes[4] << 8);
//   const hr = bytes[5];
//   const crc = bytes[6];
//   return { magic, seq, tempC: tempRaw / 100, heartRate: hr, crc };
// });
