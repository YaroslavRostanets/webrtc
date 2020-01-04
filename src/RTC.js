import SignalEmitter from './SignalEmitter';
const se = new SignalEmitter('ws://localhost:3001/');

const config = {
  iceServers: [
    {
      urls: ["stun: stun1.l.google.com:19302",
        "stun: stun1.voiceeclipse.net:3478",
        "stun: stun2.l.google.com:19302",
        "stun: stun3.l.google.com:19302"]
    },
  ]
};

export default class RTC {
  constructor(isControl, videoStreamCallback, dataChannelCallback) {
    console.log('isControl: ', isControl);
    this.isControl = isControl;
    this.videoStreamCallback = videoStreamCallback;
    this.dataChannelCallback = dataChannelCallback;
    this.pc = new RTCPeerConnection(config);
    this.pc.onicecandidate = evt => {
      if(evt.candidate) {
        se.send('ICE', evt.candidate);
      }
    };
    this.pc.onconnection = () => {
      console.log('Connection established');
    };
    this.pc.onclosedconnection = () => {
      console.log('Disconnected');
    };
    this.pc.addEventListener('track', e => {
      this.videoStreamCallback(e.streams[0]);
    });
    if (isControl) {
      this.channel = this.pc.createDataChannel('RTCDataChannel');
      this.channel.onopen = () => {
        console.log('RTCDataChannel open');
        this.dataChannelCallback(this.channel);

      };
      this.channel.onclose = () => console.log('Channel closed');
      this.channel.onerror = err => console.log('Channel error:', err);
      this.channel.onmessage = e => console.log('Incoming message:', e.data);
    } else {
      this.pc.ondatachannel = (e) => {
        this.channel = e.channel;
        this.channel.onopen = () => {
          console.log('TEST');
        };
        this.channel.onclose = () => console.log('Channel closed');
        this.channel.onerror = err => console.log('Channel error:', err);
        this.channel.onmessage = e => console.log('Incoming message:', e.data);
      };
    }
    se.on('SDP', sdp => {
      console.log('SDP CANDIDATE: ', sdp);
      this._setRemoteSDP(sdp);
    });
    se.on('ICE', ice => {
      console.log('ICE CANDIDATE: ', ice);
      this.pc.addIceCandidate(new RTCIceCandidate(ice));
    });
  }

  _setRemoteSDP(sdp) {
    this.pc.setRemoteDescription(new RTCSessionDescription(sdp), () => {
      console.log('SET_REMOTE_DESC: ', sdp);
      if(this.pc.remoteDescription.type == 'offer') {
        this.createAnswer();
      }
    }, (err) => {
      console.log('Failed to setRemoteDescription():', err);
    });
  }

  async createOffer() {
    //await this._addStream();
    return this.pc.createOffer({offerToReceiveVideo: true})
      .then(offer => {
      this.pc.setLocalDescription(offer);
      return offer;
    })
      .then(offer => {
        se.send('SDP', offer);
      })
      .catch(err => console.error(err));
  }

  async createAnswer() {
    await this._addStream();
    this.pc.createAnswer()
      .then( answer => {
        this.pc.setLocalDescription(answer);
        return answer;
      })
      .then(answer => {
        se.send('SDP', answer);
      })
  }

  async _addStream() {
    return navigator.mediaDevices.getUserMedia({video: true, audio: false})
      .then(stream => {
        console.log('stream: ', stream);
        stream.getTracks().forEach(track => this.pc.addTrack(track, stream));
      })
      .catch(function(err) {
        console.log(err);
        /* handle the error */
      });
  }
}

