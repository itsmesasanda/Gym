import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen        from "./screens/LoginScreen";
import RegisterScreen     from "./screens/RegisterScreen";
import GoalScreen         from "./screens/GoalScreen";
import MeasurementsScreen from "./screens/MeasurementsScreen";
import DailyTargetsScreen from "./screens/DailyTargetsScreen";
import ProfileScreen      from "./screens/ProfileScreen";
import CaloriesScreen     from "./screens/CaloriesScreen";
import VideoLibraryScreen from "./screens/VideoLibraryScreen";

import TabNavigator       from "./navigation/TabNavigator";

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
          AIWorkouts: "ai-workouts",
          AIMeals: "ai-meals",
          Progress: "progress",
        },
      },
      Profile: "profile",
      CalorieLog: "calorie-log",
      VideoLib: "video-library",
      MeasurementsPage: "measurements-page",
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
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="Register"     component={RegisterScreen} />
        <Stack.Screen name="Goal"         component={GoalScreen} />
        <Stack.Screen name="Measurements" component={MeasurementsScreen} />
        <Stack.Screen name="DailyTargets" component={DailyTargetsScreen} />

        <Stack.Screen name="Tabs" component={TabNavigator} />

        <Stack.Screen name="Profile"          component={ProfileScreen} />
        <Stack.Screen name="CalorieLog"       component={CaloriesScreen} />
        <Stack.Screen name="VideoLib"         component={VideoLibraryScreen} />
        <Stack.Screen name="MeasurementsPage" component={MeasurementsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
