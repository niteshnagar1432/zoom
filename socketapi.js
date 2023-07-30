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

  socket.on('disconnect', () => {
    console.log('user Disconnected');
  
    var disConnectUser = userConnections.find((user) => {
      return user.currentSocket == socket.id;
    });
  
    if (disConnectUser) {
      var connectionId = disConnectUser.roomId;
      console.log(connectionId);
  
      var remainingUsers = userConnections.filter((u) => {
        return u.currentSocket != disConnectUser.currentSocket;
      });
  
      console.log(disConnectUser);
  
      // Send 'user_left' event to remaining users in the same room
      var list = remainingUsers.filter((user) => {
        return user.roomId == connectionId;
      });
  
      list.forEach((user) => {
        io.to(user.currentSocket).emit('user_left', { disconnectedUser: disConnectUser });
      });
  
      // Remove the disconnected user from the userConnections array
      userConnections = remainingUsers;
    }
  });
  

});

// end of socket.io logic

module.exports = socketapi;