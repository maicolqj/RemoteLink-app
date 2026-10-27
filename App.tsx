import { ApolloProvider } from '@apollo/client/react';
import { enableFreeze } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import apolloClient from './src/data/lib/apollo/client';
import RootNavigator from './src/presentation/navigation/RootNavigator';
import { AppUpdateGate } from './src/presentation/components/AppUpdateGate';
import { ObservabilityIdentity } from './src/presentation/components/ObservabilityIdentity';
import { initObservability } from './src/infraestructure/services/observability';
import * as Sentry from '@sentry/react-native';

initObservability();

enableFreeze(true);

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <AppUpdateGate>
          <ObservabilityIdentity />
          <RootNavigator />
        </AppUpdateGate>
      </SafeAreaProvider>
    </ApolloProvider>
  );
}

export default Sentry.wrap(App);
