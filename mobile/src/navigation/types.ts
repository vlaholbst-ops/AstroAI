import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Input: undefined;
  ChartResults: undefined; // данные через Redux, не через params
};

export type InputScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Input"
>;
export type ChartResultsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ChartResults"
>;
