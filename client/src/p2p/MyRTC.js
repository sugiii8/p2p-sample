import { EventEmitter } from "events";

export class MyRTC extends EventEmitter {
  constructor() {
    super();
    this.ws = new WebSocket("ws://localhost:8082/");
    this.pc = new RTCPeerConnection();
    const { ws, pc } = this;

    ws.onopen = () => {
      this.emit("init");
    };
    ws.onclose = () => {
      console.log("connection ended");
    };
    ws.onerror = error => {
      console.log(error);
    };
    ws.onmessage = message => {
      const msg = JSON.parse(message.data);
      console.log(msg.type, pc.signalingState);

      if (msg.type === "joined") {
        console.log("部屋に参加しました. 通信相手が来るのを待機中です...");
      }
      if (msg.type === "failed") {
        console.log("部屋が満員でした");
        this.close();
      }
      if (msg.type === "matched") {
        console.log("通信相手が見つかりました");
        this.emit("matched", msg.remoteName);
        if (msg.offerer) {
          // とりあえず全てaccept
          ws.send(JSON.stringify({ type: "accept" }));
        }
      }
      if (msg.type === "accepted") {
        console.log("通信が受け入れられました");
        console.log("オファーを送ります");
        this.emit("signalingReady");
      }
      if (msg.type === "offer") {
        console.log("オファーが届きました");
        console.log("アンサーを返します");
        this.emit("offerArrived", msg);
      }
      if (msg.type === "answer") {
        console.log("アンサーが届きました", msg);
        pc.setRemoteDescription(msg);
      }
    };

    pc.ontrack = ev => {
      this.emit("stream", ev.streams[0]);
    };
    pc.onicecandidate = ev => {
      // 全ての通信経路の候補が出尽くした
      if (ev.candidate === null) {
        const sdp = pc.localDescription;
        ws.send(JSON.stringify(sdp));
      }
    };
    pc.onnegotiationneeded = ev => {
      console.log("onnegotiationneeded: ", ev);
    };
  }

  join(name) {
    const msg = {
      type: "join",
      name: name
    };
    this.ws.send(JSON.stringify(msg));
  }

  async sendOffer(stream) {
    const { pc } = this;
    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }
    const offer = await pc.createOffer();
    pc.setLocalDescription(offer);
  }

  async sendAnswer(stream, sdp) {
    const { pc } = this;
    pc.setRemoteDescription(sdp);
    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }
    const answer = await pc.createAnswer();
    pc.setLocalDescription(answer);
  }

  close() {
    this.ws.close();
    this.pc.close();
  }
}
