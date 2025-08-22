// Whitelist of BLE devices the app cares about.
// Developer: populate with your target device names and UUIDs.
// Each entry can define service/characteristic UUIDs used for notifications and any
// optional desired MTU/packet length hints. UUIDs can be 128-bit or 16-bit (expanded at runtime).

export const DEVICE_WHITELIST = [
  // Dummy device for development/testing at 100 Hz
  {
    id: "dummy-001",
    name: "VitalLink Dummy",
    services: {},
    characteristics: { notify: "" },
    desiredMTU: 185,
    defaultPacketLength: 12,
    parserId: "dummy-v1",
  },
  // ECG and PPG demo devices
  { id: "ecg-001", name: "VitalLink ECG", services: {}, characteristics: { notify: "" }, desiredMTU: 185, defaultPacketLength: 6, parserId: "wave-ecg" },
  { id: "ppg-001", name: "VitalLink PPG", services: {}, characteristics: { notify: "" }, desiredMTU: 185, defaultPacketLength: 6, parserId: "wave-ppg" },
];

export function getDeviceById(id) {
  return DEVICE_WHITELIST.find((d) => d.id === id);
}

export function isWhitelistedName(name) {
  if (!name) return false;
  return DEVICE_WHITELIST.some((d) => d.name === name);
}
