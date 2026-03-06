import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { InputScreen } from "../screens/InputScreen";
import { ChartResultsScreen } from "../screens/ChartResultsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Input" component={InputScreen} />
      <Stack.Screen name="ChartResults" component={ChartResultsScreen} />
    </Stack.Navigator>
  );
}
