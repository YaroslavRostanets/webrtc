<template>
  <div>
    control
    <button @click="webrtc.createOffer()">CONNECT</button>
  </div>
</template>

<script>
  import SignalEmitter from '../SignalEmitter';
  import RTC from '../RTC';

  //const webrtc = new RTC(true);

  export default {
    name: "control",
    methods: {
      async connect() {
        //SignalEmitter.on('SDP', () => console.log('_SDP: '));
      }
    },
    created() {
      this.webrtc = new RTC(true);
      SignalEmitter.subscribe('control');
    }
  }
</script>

<style scoped>

</style>
