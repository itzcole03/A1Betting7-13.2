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
      className='fixed top-2 right-2 z-50 px-3 py-1 rounded bg-slate-800 text-white text-xs shadow'
      data-testid={`websocket-status-${statusMap[status].replace(/\s+/g, '-').toLowerCase()}`}
    >
      WebSocket: {statusMap[status]}
    </div>
  );
};

export default WebSocketStatusIndicator;
