import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/socket";

const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:4500");
const socketPath = import.meta.env.VITE_SOCKET_PATH || "/socket.io";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl, {
  autoConnect: true,
  path: socketPath,
  transports: ["websocket", "polling"]
});
