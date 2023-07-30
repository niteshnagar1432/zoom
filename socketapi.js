const io = require('socket.io')();
const socketapi = {
  io: io
};

var userConnections = [];

// Add your socket.io logic here!
io.on("connection", function (socket) {

  socket.on('userconnect', (data) => {

    var otherUsers = userConnections.filter((user) => {
      return user.roomId == data.roomId
    });

    userConnections.push({
      currentSocket: socket.id,
      displayName: data.displayName,
      roomId: data.roomId
    });

    io.emit('other_info_meeting', {
      otherUserId: data.displayName,
      connId: socket.id
    })

    socket.emit('infom_me_about_outher', {otherUsers})

    otherUsers.forEach(other => {
      io.to(socket.id).emit('other_info_meeting', {
        otherUserId: other.displayName,
        connId: other.currentSocket
      });
    });

  });


  socket.on('SDPProcess', (data) => {
    console.log(data);
    io.to(data.to_connid).emit('SDPProcess', {
      message: data.message,
      from_connid: socket.id
    })
  })

});

// end of socket.io logic

module.exports = socketapi;