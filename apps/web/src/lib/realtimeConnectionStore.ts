type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

let status: ConnectionStatus = "disconnected";
let listeners: Array<() => void> = [];

export function getRealtimeStatus(): ConnectionStatus {
  return status;
}

export function setRealtimeStatus(s: ConnectionStatus) {
  status = s;
  emitChange();
}

export function subscribeRealtimeConnection(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function emitChange() {
  listeners.forEach((l) => l());
}
