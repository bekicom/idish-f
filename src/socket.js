import io from "socket.io-client";

// const SOCKET_URL = `https://kwmkqg1t-8081.euw.devtunnels.ms`;
const SOCKET_URL = `https://idish25.richman.uz`;
// const SOCKET_URL = `http://localhost:8080`;
const socket = io(SOCKET_URL, { transports: ["websocket"] });

export default socket;
