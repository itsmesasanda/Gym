import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen              from "./screens/LoginScreen";
import RegisterScreen           from "./screens/RegisterScreen";
import GoalScreen               from "./screens/GoalScreen";
import MeasurementsScreen       from "./screens/MeasurementsScreen";
import DailyTargetsScreen       from "./screens/DailyTargetsScreen";
import ProfileScreen            from "./screens/ProfileScreen";
import CaloriesScreen           from "./screens/CaloriesScreen";
import VideoLibraryScreen       from "./screens/VideoLibraryScreen";
import WorkoutScreen            from "./screens/WorkoutScreen";
import AdminLoginScreen         from "./screens/AdminLoginScreen";

// New screens
import AiCoachChatScreen        from "./screens/AiCoachChatScreen";
import BeginnerGuideScreen      from "./screens/BeginnerGuideScreen";
import StreaksScreen             from "./screens/StreaksScreen";
import QRCheckinScreen          from "./screens/QRCheckinScreen";
import CheckinConfirmationScreen from "./screens/CheckinConfirmationScreen";
import AccessLockedScreen       from "./screens/AccessLockedScreen";
import NotificationsScreen      from "./screens/NotificationsScreen";
import DrawerSidebarScreen      from "./screens/DrawerSidebarScreen";
import TutorialScreen           from "./screens/TutorialScreen";

import TabNavigator       from "./navigation/TabNavigator";
import AdminTabNavigator  from "./navigation/AdminTabNavigator";

import { hydrateSession, getUserEmail } from "./utils/session";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";

const Stack = createNativeStackNavigator();

const CalorieLogScreen = () => <CaloriesScreen initialView="log" />;

const LoadingScreen = () => (
  <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
    <ActivityIndicator size="large" color="#C7F000" />
  </View>
);

const ProtectedAdminTabs = ({ navigation }) => {
  const { token, loading } = useAdminAuth();
  useEffect(() => {
    if (!loading && !token) navigation.replace("AdminLogin");
  }, [loading, navigation, token]);
  if (loading || !token) return <LoadingScreen />;
  return <AdminTabNavigator />;
};

function AppNavigator() {
  const [ready, setReady]           = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    (async () => {
      await hydrateSession();
      setHasSession(!!getUserEmail());
      setReady(true);
    })();
  }, []);

  if (!ready) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
        initialRouteName={hasSession ? "Tabs" : "Login"}
      >
        {/* ── Auth Flow ── */}
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="AdminLogin"   component={AdminLoginScreen} />
        <Stack.Screen name="Register"     component={RegisterScreen} />
        <Stack.Screen name="Goal"         component={GoalScreen} />
        <Stack.Screen name="Measurements" component={MeasurementsScreen} />
        <Stack.Screen name="DailyTargets" component={DailyTargetsScreen} />
        <Stack.Screen name="Tutorial"     component={TutorialScreen} />

        {/* ── Main App ── */}
        <Stack.Screen name="Tabs"      component={TabNavigator} />
        <Stack.Screen name="AdminTabs" component={ProtectedAdminTabs} />

        {/* ── Stack Screens ── */}
        <Stack.Screen name="CalorieLog"       component={CalorieLogScreen} />
        <Stack.Screen name="WorkoutLog"       component={WorkoutScreen} />
        <Stack.Screen name="VideoLib"         component={VideoLibraryScreen} />
        <Stack.Screen name="MeasurementsPage" component={MeasurementsScreen} />

        {/* ── New Screens ── */}
        <Stack.Screen name="AiCoachChat"         component={AiCoachChatScreen} />
        <Stack.Screen name="BeginnerGuide"        component={BeginnerGuideScreen} />
        <Stack.Screen name="Streaks"             component={StreaksScreen} />
        <Stack.Screen name="QRCheckin"           component={QRCheckinScreen} />
        <Stack.Screen name="CheckinConfirmation" component={CheckinConfirmationScreen} />
        <Stack.Screen name="AccessLocked"        component={AccessLockedScreen} />
        <Stack.Screen name="Notifications"       component={NotificationsScreen} />
        <Stack.Screen
          name="Drawer"
          component={DrawerSidebarScreen}
          options={{ animation: "slide_from_left", presentation: "transparentModal" }}
        />
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
