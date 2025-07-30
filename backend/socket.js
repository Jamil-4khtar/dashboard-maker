export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);


    socket.on("disconnect", () => {
      console.log("User got disconnected:", socket.id);
    });
  });

}