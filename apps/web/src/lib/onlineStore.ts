const onlineUsers = new Set<string>();
let listeners: Array<() => void> = [];

export function isOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export function setOnlineUsers(ids: string[]) {
  onlineUsers.clear();
  ids.forEach((id) => onlineUsers.add(id));
  emitChange();
}

export function addOnlineUser(userId: string) {
  onlineUsers.add(userId);
  emitChange();
}

export function removeOnlineUser(userId: string) {
  onlineUsers.delete(userId);
  emitChange();
}

export function subscribeOnline(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

let cachedSnapshot: string[] = [];

export function getOnlineSnapshot(): string[] {
  const next = Array.from(onlineUsers);
  if (next.length !== cachedSnapshot.length || !next.every((id, i) => id === cachedSnapshot[i])) {
    cachedSnapshot = next;
  }
  return cachedSnapshot;
}

function emitChange() {
  listeners.forEach((l) => l());
}
