import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.medsnap.nutriplan",
  appName: "NutriPlan",
  webDir: "out",
  backgroundColor: "#f6f7f7",
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#36795d",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK", // dark icons on the light app chrome
      backgroundColor: "#f6f7f7",
    },
    Keyboard: {
      resize: "native",
    },
  },
};

export default config;
