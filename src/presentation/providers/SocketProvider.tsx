import React from 'react';

// Socket.IO provider — stub until socket infrastructure is implemented.
// When ready, restore the full implementation from the EntryLink project
// and wire up: useSocket, useSocketEvent, useVisitorStore, usePackageStore.

interface Props {
  children: React.ReactNode;
}

export function SocketProvider({ children }: Props) {
  return <>{children}</>;
}
