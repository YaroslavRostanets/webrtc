<template>
  <div>
    platform
    <button @click="send">SDP</button>
  </div>
</template>

<script>
  import SignalEmitter from '../SignalEmitter';
  import RTC from '../RTC';

  export default {
    name: "platform",
    methods: {
      send: function () {

      }
    },
    created() {
      const webrtc = new RTC(false);
      SignalEmitter.subscribe('platform');
    }
  }
</script>

<style scoped>

</style>
