import { Server } from "socket.io";
let io: any;

export default {
  init: (httpServer: any) => {
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
        allowedHeaders: ["Content-Type", "Authorization"],
      },
    });
    return io;
  },
  getIO: () => {
    //     if (!ioObject) {
    //       throw Error("Socket undefined");
    //     }
    //     return ioObject;
  },
};
