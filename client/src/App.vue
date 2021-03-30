<template>
  <div id="app">
    <div>
      <input type="text" name="" id="name" v-model="name" />
      <button @click="handleJoin">参加する</button>
    </div>

    <div>
      <p>{{ this.localDisplayName }} 自分</p>
      <video ref="local" src=""></video>
    </div>
    <div>
      <p>{{ this.remoteDisplayName }} 相手</p>
      <video ref="remote" src=""></video>
    </div>
  </div>
</template>

<script>
import { MyRTC } from "./p2p/MyRTC";

let myRTC = null;

export default {
  data() {
    return {
      name: "名前",
      localDisplayName: "",
      remoteDisplayName: "",
    };
  },
  methods: {
    async handleJoin() {
      if (myRTC !== null) {
        console.log("既に参加しています");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const { local } = this.$refs;
      if (local.srcObject === null) {
        local.srcObject = stream;
      }

      // Signalingサーバへの接続を開始
      myRTC = new MyRTC();
      myRTC.on("init", () => {
        console.log("onnection opened");
        myRTC.join(this.name);
      });

      // 通信相手の候補が見つかった時
      myRTC.on("matched", (remoteName) => {
        this.remoteDisplayName = remoteName + " さん";
      });

      // Signalingの準備ができたとき
      myRTC.on("signalingReady", () => {
        console.log("local stream: ", stream);
        myRTC.sendOffer(stream);
      });

      // Offer側のOfferを受けたとき
      myRTC.on("offerArrived", (sdp) => {
        myRTC.sendAnswer(stream, sdp);
      });

      // remoteのstreamを取得したとき
      myRTC.on("stream", (strm) => {
        console.log("remote stream: ", strm);
        const { remote } = this.$refs;
        if (remote.srcObject === null) {
          remote.srcObject = strm;
        }
      });

      this.localDisplayName = this.name;
    },
  },
  mounted() {
    const { local, remote } = this.$refs;
    local.onloadedmetadata = function () {
      local.play();
    };
    remote.onloadedmetadata = function () {
      remote.play();
    };
  },
  beforeDestroy() {
    if (myRTC !== null) {
      myRTC.close();
    }
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
