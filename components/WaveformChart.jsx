import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Line, Polyline, Rect } from 'react-native-svg';

// Simple, performant-enough waveform chart for ~100–250 Hz streams.
// Props:
// - data: number[] (latest samples; will map to full width)
// - height: number
// - color: string line color
// - background: optional background fill
// - yRange: [min, max] for scaling
export default function WaveformChart({ data, height = 160, color = '#32D74B', background = 'transparent', yRange = [0, 1000] }) {
  const width = 360; // will stretch via style container; we compute points relative to this width

  const points = useMemo(() => {
    const n = data.length || 1;
    const [yMin, yMax] = yRange;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const mapY = (v) => {
      const t = (clamp(v, yMin, yMax) - yMin) / Math.max(1, (yMax - yMin));
      return height - t * height; // invert so higher values are higher on screen
    };
    let pts = '';
    for (let i = 0; i < n; i++) {
      const x = (i / Math.max(1, n - 1)) * width;
      const y = mapY(data[i]);
      pts += `${x},${y} `;
    }
    return pts.trim();
  }, [data, height, yRange]);

  // simple grid
  const grid = useMemo(() => {
    const lines = [];
    const cols = 8; const rows = 4;
    for (let i = 1; i < cols; i++) {
      const x = (i / cols) * 100 + '%';
      lines.push(<Line key={`v${i}`} x1={x} y1="0" x2={x} y2="100%" stroke="#2c2c2e" strokeWidth={1} />);
    }
    for (let j = 1; j < rows; j++) {
      const y = (j / rows) * 100 + '%';
      lines.push(<Line key={`h${j}`} x1="0" y1={y} x2="100%" y2={y} stroke="#2c2c2e" strokeWidth={1} />);
    }
    return lines;
  }, []);

  return (
    <View style={{ width: '100%', height }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <Rect x="0" y="0" width="100%" height="100%" fill={background} />
        {grid}
        <Polyline points={points} fill="none" stroke={color} strokeWidth={2} />
      </Svg>
    </View>
  );
}
