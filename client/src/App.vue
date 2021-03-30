<template>
  <div id="app">
    <div>
      <input type="text" name="" id="name" v-model="name" />
      <button @click="handleJoin">参加する</button>
      <button @click="switchVideo">自分の出力先を切り替える</button>
      <button @click="switchVideoRemote">相手の出力先を切り替える</button>
    </div>

    <div class="border">
      <p>{{ this.localDisplayName }} 自分</p>
      <video ref="local" src=""></video>
    </div>
    <div class="border">
      <p>{{ this.remoteDisplayName }} 相手</p>
      <video ref="remote" src=""></video>
    </div>
    <div class="border">
      <p>{{ this.localDisplayName }} 自分:切り替え先</p>
      <video ref="switchedLocal" src=""></video>
    </div>
    <div class="border">
      <p>{{ this.localDisplayName }} 自分:切り替え先</p>
      <video ref="switchedRemote" src=""></video>
    </div>
  </div>
</template>

<script>
import { MyRTC } from "./p2p/MyRTC";

let myRTC = null;
let remoteStream = null;

export default {
  data() {
    return {
      name: this.generateRamdomName(),
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
    async switchVideo() {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const { local, switchedLocal } = this.$refs;
      if (switchedLocal.srcObject === null) {
        remoteStream = stream; // あとで切り替えるように使う
        console.log("sss", remoteStream);
        switchedLocal.srcObject = stream;
        local.srcObject = null;
        switchedLocal.play();
      }
    },
    async switchVideoRemote() {
      const { remote, switchedRemote } = this.$refs;
      if (switchedRemote.srcObject === null) {
        switchedRemote.srcObject = remoteStream;
        remote.srcObject = null;
        switchedRemote.play();
      }
    },
    generateRamdomName() {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let rand_str = "";
      for (var i = 0; i < 8; i++) {
        rand_str += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      return rand_str;
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
.border {
  border: 1px solid #ddd;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
