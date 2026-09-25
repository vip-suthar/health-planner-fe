/**
 * Coach chat is a live WebSocket (API Gateway `wss://…/{stage}`) rather than a
 * REST route. Override with NEXT_PUBLIC_COACH_WS_URL for staging/prod stages.
 * Native builds behind a tunnel/LAN need this pointed at a reachable host.
 */
export const COACH_WS_URL =
  process.env.NEXT_PUBLIC_COACH_WS_URL ??
  "wss://9nqkg12l2j.execute-api.us-east-1.amazonaws.com/dev/";
