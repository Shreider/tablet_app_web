export const defaultRoomId = (import.meta.env.VITE_ROOM_ID as string | undefined)?.trim() || null;
export const defaultRoomPath = defaultRoomId
  ? `/room/${encodeURIComponent(defaultRoomId)}`
  : '/';
