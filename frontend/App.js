import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// User screens
import LoginScreen        from "./screens/LoginScreen";
import RegisterScreen     from "./screens/RegisterScreen";
import GoalScreen         from "./screens/GoalScreen";
import MeasurementsScreen from "./screens/MeasurementsScreen";
import DailyTargetsScreen from "./screens/DailyTargetsScreen";

import TabNavigator       from "./navigation/TabNavigator";

// ── Admin imports temporarily disabled (broken code in screens/admin/*) ──
// import AdminLoginScreen   from "./screens/AdminLoginScreen";
// import AdminTabNavigator  from "./navigation/AdminTabNavigator";
// import { AdminAuthProvider } from "./context/AdminAuthContext";

import { hydrateSession, getUserEmail } from "./utils/session";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [],
  config: {
    screens: {
      Login: "login",
      Register: "register",
      Goal: "goal",
      Measurements: "measurements",
      DailyTargets: "daily-targets",
      Tabs: {
        screens: {
          Dashboard: "dashboard",
          Workouts: "workouts",
          "AI Plans": "ai-plans",
          "Vedio Library": "video-library",
          "Progress Tracking": "progress",
          Profile: "profile",
          Goal: "goal-tab",
        },
      },
    },
  },
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    (async () => {
      await hydrateSession();
      setHasSession(!!getUserEmail());
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#C7F000" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={hasSession ? "Tabs" : "Login"}
      >
        {/* User (mobile) flow */}
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="Register"     component={RegisterScreen} />
        <Stack.Screen name="Goal"         component={GoalScreen} />
        <Stack.Screen name="Measurements" component={MeasurementsScreen} />
        <Stack.Screen name="DailyTargets" component={DailyTargetsScreen} />
        <Stack.Screen name="Tabs"         component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
