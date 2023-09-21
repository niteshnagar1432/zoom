function requestMediaPermission() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then(function (stream) {
          console.log('Permission granted: done');
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        })
        .catch(function (error) {
          console.log('Permission denied or error occurred: not allowed');
          document.body.innerHTML = '<center style="color:white">Please Allow Camera or Mic Permission to use this application.</center>';
          setTimeout(requestMediaPermission, 1000);
          return;
        });
    } else {
      // Display an error message directly
      document.body.innerHTML = '<center style="color:white">Your browser does not support camera or microphone. Please choose another system or browser.</center>';
      console.log('getUserMedia is not supported in this browser.');
    }
  }
  
  requestMediaPermission();
  