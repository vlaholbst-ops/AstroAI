// App.tsx
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { Provider } from 'react-redux';
import store from './src/store/store';
import { useAppSelector } from './src/store/hooks';
import {
  selectChartIsLoaded,
  selectChartLoading,
  selectChartError,
} from './src/store/slices/chartSlice';
import { InputScreen } from './src/screens/InputScreen';
import { ChartResultsScreen } from './src/screens/ChartResultsScreen';

// ─── Роутер ───────────────────────────────────────────────────────────────────
// Лёгкий conditional routing без React Navigation.
// Переход: InputScreen → ChartResultsScreen при старте запроса.
// Обратно: кнопка «← Назад» в ChartResultsScreen → dispatch(clearChart()).

const AppNavigator: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark      = colorScheme === 'dark';

  const isLoading = useAppSelector(selectChartLoading);
  const isLoaded  = useAppSelector(selectChartIsLoaded);
  const hasError  = useAppSelector(selectChartError);

  // Показываем ChartResultsScreen как только начался запрос (loading),
  // пришли данные (isLoaded) или случилась ошибка (hasError).
  const showResults = isLoading || isLoaded || Boolean(hasError);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={false}
      />
      {showResults ? <ChartResultsScreen /> : <InputScreen />}
    </>
  );
};

// ─── Корневой компонент ───────────────────────────────────────────────────────

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        <AppNavigator />
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
});
