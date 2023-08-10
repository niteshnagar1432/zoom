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
    let userCount = userConnections.length;
    console.log(userCount);
    io.emit('other_info_meeting', {
      otherUserId: data.displayName,
      connId: socket.id,
      userCount:userCount
    })

    socket.emit('infom_me_about_outher', {otherUsers})

    otherUsers.forEach(other => {
      io.to(socket.id).emit('other_info_meeting', {
        otherUserId: other.displayName,
        connId: other.currentSocket,
        userCount:userCount
      });
    });

  });


  socket.on('SDPProcess', (data) => {
    io.to(data.to_connid).emit('SDPProcess', {
      message: data.message,
      from_connid: socket.id
    })
  })

  socket.on('sendMessage',(data)=>{
    let mUser = userConnections.find((user)=>{
      return user.currentSocket == socket.id;
    })
    if(mUser){
      let roomId = mUser.roomId;
      let from = mUser.displayName;
      let senderSocket = mUser.currentSocket;
      let list = userConnections.filter((user)=>{
        return user.roomId == roomId;
      })

      list.forEach((user)=>{
        if(user.currentSocket != senderSocket){
          io.to(user.currentSocket).emit('newMessage',{sender:from,msg:data});
        }else{
          io.to(user.currentSocket).emit('selfMessage',{sender:from,msg:data});
        }
      })

    }

  })

  socket.on('newAttechment',(data)=>{

    let mUser = userConnections.find((user)=>{
      return user.currentSocket == socket.id;
    })
    if(mUser){
      let roomId = mUser.roomId;
      let from = mUser.displayName;
      let senderSocket = mUser.currentSocket;
      let list = userConnections.filter((user)=>{
        return user.roomId == roomId;
      })

      list.forEach((user)=>{
        if(user.currentSocket != senderSocket){
          io.to(user.currentSocket).emit('newAttechment',{sender:from,filename:data.filename});
        }else{
          io.to(user.currentSocket).emit('selfAttechment',{sender:from,filename:data.filename});
        }
      })

    }
    console.log(data);
  })

  socket.on('disconnect', () => {
  
    var disConnectUser = userConnections.find((user) => {
      return user.currentSocket == socket.id;
    });
  
    if (disConnectUser) {
      var connectionId = disConnectUser.roomId;
  
      var remainingUsers = userConnections.filter((u) => {
        return u.currentSocket != disConnectUser.currentSocket;
      });
  
      console.log(disConnectUser);
  
      // Send 'user_left' event to remaining users in the same room
      var list = remainingUsers.filter((user) => {
        return user.roomId == connectionId;
      });
      let userCount = remainingUsers.length;
      list.forEach((user) => {
        io.to(user.currentSocket).emit('user_left', { disconnectedUser: disConnectUser,userCount:userCount });
      });
  
      // Remove the disconnected user from the userConnections array
      userConnections = remainingUsers;
    }
  });
  

});

// end of socket.io logic

module.exports = socketapi;