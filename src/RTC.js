import SignalEmitter from './SignalEmitter';

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
  constructor(isControl) {
    this.isControl = isControl;
    this.pc = new RTCPeerConnection(config);
    this.pc.onicecandidate = evt => {
      if(evt.candidate) {
        console.log('localCandidate: ', evt.candidate);
        SignalEmitter.send(isControl ? 'control' : 'platform', 'ICE', evt.candidate);
      }
    };
    this.pc.onconnection = () => {
      console.log('Connection established');
    };
    this.pc.onclosedconnection = () => {
      console.log('Disconnected');
    };
    if (isControl) {
      console.log('CREATE');
      this.channel = this.pc.createDataChannel('RTCDataChannel');
      this.channel.onopen = () => {
        console.log('TEST');
        setInterval(() => {
          console.log('___');
          this.channel.send('HI! PLATFORM');
        }, 5000);
      };
      this.channel.onclose = () => console.log('Channel closed');
      this.channel.onerror = err => console.log('Channel error:', err);
      this.channel.onmessage = e => console.log('Incoming message:', e.data);
    } else {
      this.pc.ondatachannel = (e) => {
        this.channel = e.channel;
        this.channel.onopen = () => {
          console.log('TEST');
          setInterval(() => {
            this.channel.send('HI, control! ');
          }, 5000);
        };
        this.channel.onclose = () => console.log('Channel closed');
        this.channel.onerror = err => console.log('Channel error:', err);
        this.channel.onmessage = e => console.log('Incoming message:', e.data);
      };
    }
    SignalEmitter.on('SDP', (sdp) => {
      console.log('SDP CANDIDATE: ', sdp);
      this._setRemoteSDP(sdp);
    });
    SignalEmitter.on('ICE', (ice) => {
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

  createOffer() {
    return this.pc.createOffer()
      .then(offer => {
      this.pc.setLocalDescription(offer);
      return offer;
    })
      .then(offer => {
        SignalEmitter.send('control', 'SDP', offer);
      })
      .catch(err => console.error(err));
  }

  createAnswer() {
    this.pc.createAnswer()
      .then( answer => {
        this.pc.setLocalDescription(answer);
        return answer;
      })
      .then(answer => {
        SignalEmitter.send('platform', 'SDP', answer);
      })
  }

  async getAnswer() {

  }
}

