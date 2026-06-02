import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import DashboardScreen from "../screens/DashboardScreen";
import WorkoutScreen   from "../screens/WorkoutScreen";
import CaloriesScreen  from "../screens/CaloriesScreen";
import ProfileScreen   from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const GREEN = "#C7F000";
const DARK  = "rgba(10,10,10,0.97)";
const MUTED = "#555555";

function TabIcon({ name, focused }) {
  const color = focused ? GREEN : MUTED;
  const size  = 22;
  if (name === "Dashboard")  return <Feather name="home" size={size} color={color} />;
  if (name === "WorkoutLog") return <MaterialCommunityIcons name="dumbbell" size={size} color={color} />;
  if (name === "Nutrition")  return <MaterialCommunityIcons name="food-apple" size={size} color={color} />;
  if (name === "Profile")    return <Feather name="user" size={size} color={color} />;
  return null;
}

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={s.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const isQR = route.name === "__QR__";

        if (isQR) {
          return (
            <TouchableOpacity
              key="qr"
              style={s.qrWrap}
              onPress={() => navigation.navigate("QRCheckin")}
              activeOpacity={0.85}
            >
              <View style={s.qrBtn}>
                <MaterialIcons name="qr-code" size={26} color="#000" />
                <Text style={s.qrLabel}>Check In</Text>
              </View>
            </TouchableOpacity>
          );
        }

        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || route.name;
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.key} style={s.tabBtn} onPress={onPress} activeOpacity={0.7}>
            <TabIcon name={route.name} focused={focused} />
            <Text style={[s.tabLabel, focused && s.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function QRPlaceholder() { return null; }

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen} options={{ tabBarLabel: "Home"      }} />
      <Tab.Screen name="WorkoutLog" component={WorkoutScreen}   options={{ tabBarLabel: "Train"     }} />
      <Tab.Screen name="__QR__"     component={QRPlaceholder}   options={{ tabBarLabel: ""          }} />
      <Tab.Screen name="Nutrition"  component={CaloriesScreen}  options={{ tabBarLabel: "Nutrition" }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}   options={{ tabBarLabel: "Profile"   }} />
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: DARK,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
    alignItems: "flex-end",
  },

  tabBtn:         { flex: 1, alignItems: "center", paddingTop: 4, gap: 3 },
  tabLabel:       { fontSize: 10, color: MUTED, fontWeight: "500" },
  tabLabelActive: { color: GREEN, fontWeight: "700" },

  qrWrap: { flex: 1, alignItems: "center", marginTop: -22 },
  qrBtn: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: GREEN,
    alignItems: "center", justifyContent: "center",
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
    borderWidth: 3, borderColor: "rgba(0,0,0,0.6)",
  },
  qrLabel: { fontSize: 8, color: "#000", fontWeight: "700", letterSpacing: 0.3, marginTop: 2 },
});
