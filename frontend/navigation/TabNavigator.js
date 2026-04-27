import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import DashboardScreen from "../screens/DashboardScreen";
import WorkoutScreen from "../screens/WorkoutScreen";
import WorkoutPlanScreen from "../screens/WorkoutPlanScreen";
import MealPlanScreen from "../screens/MealPlanScreen";
import VideoLibraryScreen from "../screens/VideoLibraryScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ProfileScreen from "../screens/ProfileScreen";
import GoalScreen from "../screens/GoalScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 14,
        },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Workouts" component={WorkoutScreen} />
      <Tab.Screen name="AI Plans" component={WorkoutPlanScreen} />
      <Tab.Screen name="Meal Plans" component={MealPlanScreen} />
      <Tab.Screen name="Vedio Library" component={VideoLibraryScreen} />
      <Tab.Screen name="Progress Tracking" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Goal" component={GoalScreen} />
    </Tab.Navigator>
  );
}
