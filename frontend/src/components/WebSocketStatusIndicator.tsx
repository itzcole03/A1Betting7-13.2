import React, { useContext } from 'react';
import {
  _WebSocketContext,
  WebSocketContextType,
  WebSocketStatus,
} from '../contexts/WebSocketContext';

const statusMap: Record<WebSocketStatus, string> = {
  connecting: 'Connecting...',
  connected: 'Connected',
  disconnected: 'Disconnected',
  reconnecting: 'Reconnecting...',
};

export const WebSocketStatusIndicator: React.FC = () => {
  const ctx = useContext(_WebSocketContext) as WebSocketContextType | undefined;
  const status: WebSocketStatus = ctx?.status || 'disconnected';

  return (
    <div
      data-testid='websocket-status-indicator'
      className='fixed top-2 right-2 z-50 px-3 py-1 rounded bg-slate-800 text-white text-xs shadow'
    >
      WebSocket: {statusMap[status]}
    </div>
  );
};

export default WebSocketStatusIndicator;
