import React from 'react.ts';
export declare const WebSocketMessageTypes: {
  readonly PING: 'ping';
  readonly PONG: 'pong';
  readonly CLIENT_AUTH: 'client_auth';
  readonly AUTH_STATUS: 'auth_status';
  readonly CLIENT_SUBSCRIBE: 'client_subscribe';
  readonly CLIENT_UNSUBSCRIBE: 'client_unsubscribe';
  readonly LIVE_ODD_UPDATE: 'live_odd_update';
  readonly ENTRY_UPDATE: 'entry_update';
  readonly MARKET_UPDATE: 'market_update';
  readonly PREDICTION_STREAM: 'prediction_stream';
  readonly SERVER_NOTIFICATION: 'server_notification';
};
export type KnownWebSocketMessageType =
  (typeof WebSocketMessageTypes)[keyof typeof WebSocketMessageTypes];
declare const EntryTracking: React.FC;
export default EntryTracking;
