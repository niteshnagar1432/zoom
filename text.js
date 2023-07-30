var socket = io();
let AppProcess = (() => {

    var peers_connection_ids = [];
    var peers_connection = [];
    var remote_vid_stream = [];
    var remote_aud_stream = [];
    var local_div;
    var isAudioMute = true;
    var rtp_audio_senders = [];
    var rtp_video_senders = [];
    var videoStates = {
        none: 0,
        camera: 1,
        screen: 2,
    }
    var video_state = videoStates.none
    var videoCamTrack;
    var serverProcess;
    var audio;

    async function _init(SDP_FUNC, MY_CONNID) {
        serverProcess = SDP_FUNC;
        my_connection_Id = MY_CONNID;
        eventProcess();
        local_div = document.querySelector('#local-vdo');
    }

    function eventProcess() {
        $('#micMuteUnmute').on('click', async () => {
            if (!audio) {
                await loadAudio();
            }
            if (!audio) {
                console.log('Audio Permission Not Granted...');
                return;
            }
            if (isAudioMute) {
                audio.enabled = true
                // $(this).html('') mute false button code here
                updateMediaSenders(audio,rtp_audio_senders);
            } else {
                audio.enabled = false
                // $(this).html('') mute true button code here
                removeMediaSenders(rtp_audio_senders);
            }
            isAudioMute = !isAudioMute;
        })

        $('#video-cam-on-off').on('click', async () => {
            if (video_state == videoStates.camera) {
                await videoProcess(videoStates.none);
            } else {
                await videoProcess(videoStates.camera);
            }
        })

        $('#screen-share-on-off').on('click', async () => {
            if (video_state == videoStates.screen) {
                await videoProcess(videoStates.none);
            } else {
                await videoProcess(videoStates.screen);
            }
        })
    }

    function connection_status(connection) {
        if (connection && (connection.connectionState == 'new' || connection.connectionState == 'connecting' || connection.connectionState == 'connected')) {
            return true;
        } else {
            return false;
        }
    }

    async function updateMediaSenders(track, rtp_senders) {
        for (var con_id in peers_connection_ids) {
            if (connection_status(peers_connection[con_id])) {
                if (rtp_senders[con_id] && rtp_senders[con_id].track) {
                    rtp_senders[con_id].replaceTrack(track)
                } else {
                    rtp_senders[con_id] = peers_connection[con_id].addTrack(track);
                }
            }
        }
    }

    function removeVideoSnders(rtp_senders){
        for (var conn_id in peers_connection_ids) {
            if(rtp_senders[conn_id] && connection_status(peers_connection[conn_id])){
                peers_connection[conn_id].removeTrack(rtpSenders[conn_id]); //dout
                rtp_senders[conn_id] = null;
            }
        }
    }

    function removeVideoStream(rtp_video_senders){
        if(videoCamTrack){
            videoCamTrack.stop();
            videoCamTrack = null;
            local_div.srcObject = null;
            removeVideoSnders(rtp_video_senders);
        }
    }

    async function videoProcess(newState) {
        if(newState == videoStates.none){
            //video off btn code
            video_state = newState;
            removeVideoStream(rtp_video_senders);
            return;
        }
        if(newState == videoStates.camera){
            //video on btn code
        }
        try {
            var vStream = null;
            if (newState == videoStates.camera) {
                vStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        height: 1920,
                        width: 1080
                    },
                    audio: false
                })
            } else if (newState == videoStates.screen) {
                vStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        height: 1920,
                        width: 1080
                    },
                    audio: false
                })
            }

            if (vStream && vStream.getVideoTracks().length > 0) {
                videoCamTrack = vStream.getVideoTracks()[0];
                if (videoCamTrack) {
                    local_div.srcObject = new MediaStream([videoCamTrack]);
                    updateMediaSenders(videoCamTrack, rtp_video_senders);
                }
            }

        } catch (error) {
            console.log(error)
            return;
        }
        video_state = newState
    }

    async function loadAudio() { 

    }

    var iceConfigration = {
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302'
            },
            {
                urls: 'stun:stun1.l.google.com:19302'
            }
        ]
    }

    async function setNewConnection(connnId) {

        var connection = new RTCPeerConnection(iceConfigration);

        connection.onnegotiationneeded = async (event) => {
            await setOffer(connnId);
        }

        connection.onicecandidate = (event) => {
            if (event.candidate) {
                serverProcess(JSON.stringify({
                    icecandidate: event.candidate
                }), connnId);
            }
        }

        connection.ontrack = (event) => {
            if (!remote_vid_stream[connnId]) {
                remote_vid_stream[connnId] = new MediaStream();
            }
            if (!remote_aud_stream[connnId]) {
                remote_aud_stream[connnId] = new MediaStream();
            }
            if (event.track.kind == 'video') {
                remote_vid_stream[connnId]
                    .getVideoTracks()
                    .forEach((t) => {
                        remote_vid_stream[connnId].removeTrack(t);
                    })
                remote_vid_stream[connnId].addTrack(event.track);
                var remoteVideoPlayer = document.querySelector('#v_' + connnId)
                remoteVideoPlayer.srcObject = null;
                remoteVideoPlayer.srcObject = remote_vid_stream[connnId];
                remoteVideoPlayer.load();
            } else if (event.track.kind == 'audio') {
                remote_aud_stream[connnId]
                    .getAudioTracks()
                    .forEach((t) => {
                        remote_aud_stream[connnId].removeTrack(t);
                    })
                remote_aud_stream[connnId].addTrack(event.track);
                var remoteAuidoPlayer = document.querySelector('#a_' + connnId)
                remoteAuidoPlayer.srcObject = null;
                remoteAuidoPlayer.srcObject = remote_aud_stream[connnId];
                remoteAuidoPlayer.load();
            }
        }

        peers_connection_ids[connnId] = connnId;
        peers_connection[connnId] = connection;

        if (video_state == videoStates.camera || video_state == videoStates.screen) {
            if (videoCamTrack) {
                updateMediaSenders(videoCamTrack, rtp_video_senders);
            }
        }
        return connection;
    } 

    async function setOffer(connnId) {
        var connection = peers_connection[connnId];
        var offer = await connection.createOffer();
        await connection.setLocalDescription(offer)
        serverProcess(JSON.stringify({
            offer: connection.localDescription,
        }), connnId);
    }
 
    async function SDPProcess(message, from_connid) {
        message = JSON.parse(message);
        
        try {
            if (message.answer) {
                if (peers_connection[from_connid] && peers_connection[from_connid].signalingState !== 'closed') {
                    await peers_connection[from_connid].setRemoteDescription(new RTCSessionDescription(message.answer));
                }
            } else if (message.offer) {
                if (!peers_connection[from_connid] || peers_connection[from_connid].signalingState === 'closed') {
                    await setNewConnection(from_connid);
                }
                
                await peers_connection[from_connid].setRemoteDescription(new RTCSessionDescription(message.offer));
                const answer = await peers_connection[from_connid].createAnswer();
                await peers_connection[from_connid].setLocalDescription(answer);
                
                await serverProcess(JSON.stringify({
                    answer: answer,
                }), from_connid);
            } else if (message.icecandidate) {
                if (!peers_connection[from_connid] || !peers_connection[from_connid].remoteDescription) {
                    await setNewConnection(from_connid);
                } 
                
                await peers_connection[from_connid].addIceCandidate(message.icecandidate);
            }
        } catch (error) {
            console.log("Error in SDPProcess:", error);
        }
    }
    
    



    return {
        setNewConnection: async function (connId) {
            await setNewConnection(connId);
        },
        init: async function (SDP_FUNC, MY_CONNID) {
            await _init(SDP_FUNC, MY_CONNID);
        },
        processClientFunc: async function (data, from_connid) {
            await SDPProcess(data, from_connid);
        },
    }

})();

let MyApp = (() => {

    var user_id = '';
    var meeting_id = '';

    function init(uid, mid) {
        user_id = uid;
        meeting_id = mid;
        event_progress_for_singnle();
        document.title = "Room :- " + meeting_id;
    }

    function event_progress_for_singnle() {

        var SDP_func = (data, to_connid) => {
            socket.emit('SDPProcess', {
                message: data,
                to_connid: to_connid
            });
        }

        AppProcess.init(SDP_func, socket.id);
        if (user_id != '' && meeting_id != '') {
            socket.emit('userconnect', {
                displayName: user_id,
                roomId: meeting_id
            });
        }

        socket.on('other_info_meeting', (user) => {
            if (user) {
                console.log(user)
                addUser(user.otherUserId, user.connId);
                AppProcess.setNewConnection(user.connId);
            }
        })

        socket.on('infom_me_about_outher', (other_users) => {
            if (other_users) {
                try {
                    for (let index = 0; index < other_users.length; index++) {
                        addUser(other_users[index].displayName, other_users[index].roomId);
                        console.log(other_users[index].displayName);
                        AppProcess.setNewConnection(other_users[index].roomId);
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        })

        socket.on('SDPProcess', async (data) => {
            await AppProcess.processClientFunc(data.message, data.from_connid);
        })
    }

    function addUser(otherUserId, connId) {
        let newDiv = $('#cloneDiv').clone();
        newDiv = newDiv.attr('id', connId).addClass('other');
        newDiv.find('h2').text(otherUserId);
        newDiv.find('video').attr('id', "v_" + connId);
        newDiv.find('audio').attr('id', "a_" + connId);
        $('.container').append(newDiv);
    }

    return {
        _init: function (uid, mid) {
            init(uid, mid)
        }
    }
})()