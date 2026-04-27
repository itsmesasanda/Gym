import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AdminDashboardScreen  from '../screens/admin/AdminDashboardScreen';
import ManageUsersScreen     from '../screens/admin/ManageUsersScreen';
import ManageMealsScreen     from '../screens/admin/ManageMealsScreen';
import ManageWorkoutsScreen  from '../screens/admin/ManageWorkoutsScreen';
import ManageVideosScreen    from '../screens/admin/ManageVideosScreen';
import ManageCalorieLogsScreen from '../screens/admin/ManageCalorieLogsScreen';
import ReportsScreen         from '../screens/admin/ReportsScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tab.Screen name="AdminDashboard"  component={AdminDashboardScreen}  options={{ title: 'Dashboard', tabBarLabel: '🏠 Home'     }} />
      <Tab.Screen name="ManageUsers"     component={ManageUsersScreen}     options={{ title: 'Users',     tabBarLabel: '👥 Users'    }} />
      <Tab.Screen name="ManageMeals"     component={ManageMealsScreen}     options={{ title: 'Meals',     tabBarLabel: '🥗 Meals'    }} />
      <Tab.Screen name="CalorieLogs"     component={ManageCalorieLogsScreen} options={{ title: 'Logs',      tabBarLabel: '🔥 Logs'     }} />
      <Tab.Screen name="ManageWorkouts"  component={ManageWorkoutsScreen}  options={{ title: 'Workouts',  tabBarLabel: '🏋️ Workouts' }} />
      <Tab.Screen name="ManageVideos"    component={ManageVideosScreen}    options={{ title: 'Videos',    tabBarLabel: '🎬 Videos'   }} />
      <Tab.Screen name="Reports"         component={ReportsScreen}         options={{ title: 'Reports',   tabBarLabel: '📊 Reports'  }} />
    </Tab.Navigator>
  );
}
