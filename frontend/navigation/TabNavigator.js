import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DashboardScreen from "../screens/DashboardScreen";
import WorkoutPlanScreen from "../screens/WorkoutPlanScreen";
import MealPlanScreen from "../screens/MealPlanScreen";
import ProgressScreen from "../screens/ProgressScreen";

const Tab = createBottomTabNavigator();

function TabLabel({ label, focused }) {
  return (
    <Text style={{
      color: focused ? "#C7F000" : "#555",
      fontSize: 10,
      fontWeight: focused ? "800" : "500",
      marginTop: 2,
    }}>
      {label}
    </Text>
  );
}

function TabDot({ focused }) {
  return (
    <Text style={{
      color: focused ? "#C7F000" : "#555",
      fontSize: focused ? 20 : 16,
      fontWeight: "900",
      marginTop: -2,
    }}>
      {focused ? "—" : "·"}
    </Text>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111111",
          borderTopColor: "#1A1A1A",
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: 6,
          height: 56,
        },
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#C7F000",
        tabBarInactiveTintColor: "#555",
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AIWorkouts"
        component={WorkoutPlanScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="AI Workouts" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AIMeals"
        component={MealPlanScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="AI Meals" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Progress" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
