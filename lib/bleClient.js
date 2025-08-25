// BLE client abstraction for scanning, connecting, setting MTU, and subscribing to notifications.
// Implementation note: Expo SDK 53+ does not include classic BLE by default; you can use
// - react-native-ble-plx (Bare/Dev Client), or
// - expo-bluetooth (experimental) when available.
// This file provides a unified API and a no-op web fallback.

import { Platform } from 'react-native';
import { isWhitelistedName } from '../constants/bleDevices';

// Minimal event emitter
class Emitter {
  constructor() { this.listeners = new Map(); }
  on(evt, cb) { this.listeners.set(cb, evt); return () => this.off(cb); }
  off(cb) { this.listeners.delete(cb); }
  emit(evt, payload) { for (const [cb, e] of this.listeners) if (e === evt) cb(payload); }
}

export class BLEClient {
  constructor() {
    this.state = 'idle';
    this.emitter = new Emitter();
    this.impl = createImplementation();
  }

  on(event, cb) { return this.emitter.on(event, cb); }
  _emit(event, data) { this.emitter.emit(event, data); }

  async scanWhitelist(timeoutMs = 8000) {
    this.state = 'scanning';
    const devices = await this.impl.scan({ filter: isWhitelistedName, timeoutMs });
    this.state = 'idle';
    return devices;
  }

  async connectAndSubscribe(device, opts = {}) {
    this.state = 'connecting';
    const { mtu, onData } = opts;
    const conn = await this.impl.connect(device, { mtu });
    this.state = 'connected';
    const unsub = await this.impl.subscribe(conn, (data) => {
      this._emit('data', data);
      if (onData) onData(data);
    });
    return { conn, unsubscribe: unsub };
  }

  async disconnect() {
  await this.impl.disconnect();
  this.state = 'idle';
  // notify listeners that the connection has ended
  try { this._emit && this._emit('disconnect', { reason: 'manual' }); } catch {}
  }
}

function shouldUseMock() {
  // Use mock on web and by default in development until a native BLE library is wired in.
  if (Platform.OS === 'web') return true;
  // Allow override via EXPO_PUBLIC_USE_MOCK_BLE=false
  try {
    const v = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_USE_MOCK_BLE) || 'true';
    return String(v).toLowerCase() !== 'false';
  } catch {
    return true;
  }
}

function createImplementation() {
  if (shouldUseMock()) return new MockBLE();
  // Native placeholder until you implement with a real BLE lib.
  return new NativePlaceholder();
}

class MockBLE {
  async scan({ filter, timeoutMs }) {
    // Emit dummy and example devices; filter if requested
    const start = Date.now();
    await new Promise((r) => setTimeout(r, Math.min(600, timeoutMs)));
    const mocks = [
      { id: 'dummy-001', name: 'VitalLink Dummy' },
      { id: 'mock-2', name: 'VitalSensor_B' },
    ];
    return mocks.filter((d) => (filter ? filter(d.name) : true));
  }
  async connect(device) {
    this.device = device;
    return { deviceId: device.id };
  }
  async subscribe(_conn, onData) {
    // Push packets at 100 Hz (~10 ms interval) depending on device name
    let seq = 0;
    const name = this?.device?.name || '';
    if (name.includes('ECG')) {
      // ECG-like waveform: QRS spikes over baseline
      const fs = 250; // internal sampling rate
      this.timer = setInterval(() => {
        const t = seq / fs;
        // baseline sine + occasional spike
        let v = Math.sin(2 * Math.PI * 1.2 * t) * 50 + 500;
        if (seq % 50 === 0) v = 950; // spike
        const arr = new Uint8Array(2);
        const val = Math.max(0, Math.min(1023, v | 0));
        arr[0] = val & 0xff; arr[1] = (val >> 8) & 0xff;
        onData(arr);
        seq++;
      }, 10);
      return () => clearInterval(this.timer);
    } else if (name.includes('PPG')) {
      // PPG-like waveform: smooth pulsatile wave
      const fs = 100;
      this.timer = setInterval(() => {
        const t = seq / fs;
        const v = (Math.sin(2 * Math.PI * 1.3 * t) * 150 + 600) | 0;
        const arr = new Uint8Array(2);
        const val = Math.max(0, Math.min(1023, v));
        arr[0] = val & 0xff; arr[1] = (val >> 8) & 0xff;
        onData(arr);
        seq++;
      }, 10);
      return () => clearInterval(this.timer);
    } else {
      // Dummy packet format (10 bytes)
      const packetLen = 10; // matches dummy-v1 parser above
      this.timer = setInterval(() => {
        const arr = new Uint8Array(packetLen);
        arr[0] = 0xaa; // magic
        arr[1] = 0x55;
        arr[2] = seq & 0xff; // seq
        const ts = Date.now() & 0xffffffff; // 32-bit timestamp
        arr[3] = ts & 0xff;
        arr[4] = (ts >> 8) & 0xff;
        arr[5] = (ts >> 16) & 0xff;
        arr[6] = (ts >> 24) & 0xff;
        const value = (Math.sin(seq / 10) * 100 + 500) | 0; // example signal 0..1000-ish
        arr[7] = value & 0xff;
        arr[8] = (value >> 8) & 0xff;
        let sum = 0; for (let k = 0; k < 9; k++) sum = (sum + arr[k]) & 0xff; arr[9] = sum;
        onData(arr);
        seq = (seq + 1) & 0xff;
      }, 10);
      return () => clearInterval(this.timer);
    }
  }
  async disconnect() {
    if (this.timer) clearInterval(this.timer);
  }
}

class NativePlaceholder {
  async scan() {
    throw new Error('BLE not implemented: add a native BLE library (e.g., react-native-ble-plx) and wire it into lib/bleClient.js');
  }
  async connect() { throw new Error('BLE not implemented'); }
  async subscribe() { throw new Error('BLE not implemented'); }
  async disconnect() {}
}
