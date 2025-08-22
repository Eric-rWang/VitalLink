# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Project structure (Vitals BLE)

- `app/splash.jsx` – Loading screen with VitalLink logo shown on launch
- `app/index.jsx` – Home menu to navigate to device selection
- `app/devices.jsx` – Scans for whitelisted BLE devices and lets user choose one
- `app/stream.jsx` – Connects and streams raw packets; shows live hex and parsed views
- `constants/bleDevices.js` – Whitelist of supported devices (names, UUIDs, parser mapping)
- `lib/bleClient.js` – BLE abstraction; web/dev mock included; replace with native impl for real hardware
- `lib/parser.js` – Parser registry; add custom parsers and reference by `parserId`

### Configure supported devices

Edit `constants/bleDevices.js` and add your device entries like:

// in constants/bleDevices.js
// {
//   id: 'my-sensor',
//   name: 'VitalLink123',
//   services: { primary: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
//   characteristics: { notify: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy' },
//   desiredMTU: 247,
//   defaultPacketLength: 20,
//   parserId: 'my-parser'
// }

Then implement a parser in `lib/parser.js`:

// in lib/parser.js
// registerParser('my-parser', (bytes) => ({ /* return JSON */ }));

### BLE implementation

The included BLE client has a mock for Web/development. To stream from real devices on iOS/Android you'll need to wire in a native BLE library (e.g., `react-native-ble-plx`) and implement scan/connect/subscribe in `lib/bleClient.js`.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
