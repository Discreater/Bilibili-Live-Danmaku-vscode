import { workspace, window, commands, env, Uri } from "vscode";
import { Logger } from "./logger";
import { BilibiliClient, LiveClient, DanmakuMessage } from "bili-live-danmaku";
import { COMMAND_UPDATE_POPULARITY } from "./constants";

export default class Client {
  private static client?: Client;
  static get instance(): Client {
    return Client.client ?? (Client.client = new Client(3));
  }
  private constructor(public roomId: number) {}

  private liveClient?: LiveClient;

  public openRoomWebsite() {
    const url = `https://live.bilibili.com/${this.roomId}`;
    env.openExternal(Uri.parse(url));
  }

  public async launch() {
    Logger.init();

    const id = workspace.getConfiguration().get<number | null>("Room ID", null);
    if (id === null) {
      const inputId = await window.showInputBox({
        placeHolder: "输入房间ID",
        validateInput: value => {
          if(!Number(value)){
            return "请输入大于0的数字";
          }
          return null;
        }
      });
      this.roomId = Number(inputId);
    }else{
      this.roomId = id;
    }

    const bilibiliClient = new BilibiliClient();
    bilibiliClient.loginResponse = "true";
    this.liveClient = new LiveClient(bilibiliClient, this.roomId);
    this.liveClient.onClose = (reason) => {
      Logger.log(`已断开连接`);
      Logger.log(reason.message ?? "");
      commands.executeCommand(COMMAND_UPDATE_POPULARITY, null);
    };
    this.liveClient.onConnect = () => {
      Logger.log(`连接至房间 ${this.roomId}`);
    };
    this.liveClient.onPopularityPacket = (popularity) => {
      commands.executeCommand(COMMAND_UPDATE_POPULARITY, popularity);
    };
    this.liveClient.onCommandPacket = (command) => {
      if (command.cmd === "DANMU_MSG") {
        const dmk = new DanmakuMessage(command);
        const medal = dmk.hasFansMedal
          ? `[${dmk.fansMedalName} ${dmk.fansMedalLevel}] `
          : "";
        const outs = `${medal}@${dmk.nickname}: ${dmk.message}`;
        Logger.log(outs);
      }
    };
    this.liveClient.launch();
  }

  public stop() {
    this.liveClient?.stop();
  }
}
