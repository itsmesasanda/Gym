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
import WorkoutScreen      from "./screens/WorkoutScreen";
import AdminLoginScreen   from "./screens/AdminLoginScreen";

import TabNavigator       from "./navigation/TabNavigator";
import AdminTabNavigator  from "./navigation/AdminTabNavigator";

import { hydrateSession, getUserEmail } from "./utils/session";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";

const Stack = createNativeStackNavigator();

const CalorieLogScreen = () => <CaloriesScreen initialView="log" />;

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
      WorkoutLog: "workout-log",
      VideoLib: "video-library",
      MeasurementsPage: "measurements-page",
      AdminLogin: "admin-login",
      AdminTabs: {
        screens: {
          AdminDashboard: "admin",
          ManageUsers: "admin/users",
          ManageMeals: "admin/meals",
          CalorieLogs: "admin/calorie-logs",
          ManageWorkouts: "admin/workouts",
          ManageVideos: "admin/videos",
          Reports: "admin/reports",
        },
      },
    },
  },
};

const LoadingScreen = () => (
  <View style={{ flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center" }}>
    <ActivityIndicator size="large" color="#C7F000" />
  </View>
);

const ProtectedAdminTabs = ({ navigation }) => {
  const { token, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && !token) {
      navigation.replace("AdminLogin");
    }
  }, [loading, navigation, token]);

  if (loading || !token) return <LoadingScreen />;

  return <AdminTabNavigator />;
};

function AppNavigator() {
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
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={hasSession ? "Tabs" : "Login"}
      >
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="AdminLogin"   component={AdminLoginScreen} />
        <Stack.Screen name="Register"     component={RegisterScreen} />
        <Stack.Screen name="Goal"         component={GoalScreen} />
        <Stack.Screen name="Measurements" component={MeasurementsScreen} />
        <Stack.Screen name="DailyTargets" component={DailyTargetsScreen} />

        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="AdminTabs" component={ProtectedAdminTabs} />

        <Stack.Screen name="Profile"          component={ProfileScreen} />
        <Stack.Screen name="CalorieLog"       component={CalorieLogScreen} />
        <Stack.Screen name="WorkoutLog"       component={WorkoutScreen} />
        <Stack.Screen name="VideoLib"         component={VideoLibraryScreen} />
        <Stack.Screen name="MeasurementsPage" component={MeasurementsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AppNavigator />
    </AdminAuthProvider>
  );
}
