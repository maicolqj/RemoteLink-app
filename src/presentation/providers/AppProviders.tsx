import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AlertProvider } from './context/AlertContext';
import { NotificationProvider } from './NotificationProvider';
import { SocketProvider } from './SocketProvider';

interface Props {
  children: React.ReactNode;
}

// Single entry point for all app-level providers.
// Order matters: Theme → Alert → Socket → Notification (innermost).
export function AppProviders({ children }: Props) {
  return (
    <ThemeProvider>
      <AlertProvider>
        <SocketProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </SocketProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
