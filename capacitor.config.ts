import type { CapacitorConfig } from "@capacitor/cli";

// BVRooms native shell (Android/iOS) membungkus build PWA di dist/. API dipanggil absolut lewat VITE_API_BASE
// (set di .env saat `npm run cap:sync`). Skema http://localhost (Android) & capacitor://localhost (iOS) harus ada di
// BV_CORS_ORIGINS backend.
const config: CapacitorConfig = {
  appId: "id.buildingvision.bvrooms",
  appName: "BVRooms",
  webDir: "dist",
  // adjustMarginsForEdgeToEdge: Android 15 (targetSdk 35) memaksa edge-to-edge; default Capacitor 7 = "disable"
  // sehingga WebView menempel di bawah status bar & tumpang tindih navigation bar (env(safe-area-inset-*) tidak
  // terisi di Android WebView). "auto" memberi margin sistem sehingga header/bottom nav tidak "nempel".
  android: { allowMixedContent: false, backgroundColor: "#FFFFFF", adjustMarginsForEdgeToEdge: "auto" },
  ios: { contentInset: "automatic", backgroundColor: "#FFFFFF" },
  plugins: {
    SplashScreen: { launchShowDuration: 800, launchAutoHide: true, backgroundColor: "#FFFFFF", showSpinner: false },
    StatusBar: { style: "LIGHT", backgroundColor: "#FFFFFF" },
  },
};

export default config;
