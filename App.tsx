import { ApolloProvider } from '@apollo/client/react';
import { enableFreeze } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import apolloClient from './src/data/lib/apollo/client';
import RootNavigator from './src/presentation/navigation/RootNavigator';
import { AppUpdateGate } from './src/presentation/components/AppUpdateGate';

enableFreeze(true);

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <AppUpdateGate>
          <RootNavigator />
        </AppUpdateGate>
      </SafeAreaProvider>
    </ApolloProvider>
  );
}
