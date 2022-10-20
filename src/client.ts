import { Uri, commands, env, window, workspace } from 'vscode';
import { BilibiliClient, DanmakuMessage, LiveClient } from 'bili-live-danmaku';
import { Logger } from './logger';
import { COMMAND_UPDATE_POPULARITY } from './constants';

export default class Client {
  private static client?: Client;
  static get instance(): Client {
    return Client.client ?? (Client.client = new Client(3));
  }

  private constructor(public roomId: number) { }

  private liveClient?: LiveClient;

  public openRoomWebsite() {
    const url = `https://live.bilibili.com/${this.roomId}`;
    env.openExternal(Uri.parse(url));
  }

  public async launch() {
    const id = workspace.getConfiguration().get<number | null>('danmaku.Room ID', null);
    if (id === null || isNaN(id)) {
      const inputId = await window.showInputBox({
        placeHolder: '输入房间ID',
        validateInput: (value) => {
          if (!Number(value))
            return '请输入大于0的数字';

          return null;
        },
      });
      if (!inputId)
        return;

      this.roomId = Number(inputId);
    } else {
      this.roomId = id;
    }
    Logger.init();
    const bilibiliClient = new BilibiliClient();
    bilibiliClient.loginResponse = 'true';
    this.stop();
    this.liveClient = new LiveClient(bilibiliClient, this.roomId);
    this.liveClient.onClose = (reason) => {
      Logger.log('已断开连接');
      Logger.log(reason.message ?? '');
      commands.executeCommand(COMMAND_UPDATE_POPULARITY, null);
    };
    this.liveClient.onConnect = () => {
      Logger.log(`连接至房间 ${this.roomId}`);
    };
    this.liveClient.onPopularityPacket = (popularity) => {
      commands.executeCommand(COMMAND_UPDATE_POPULARITY, popularity);
    };
    this.liveClient.onCommandPacket = (command) => {
      if (command.cmd === 'DANMU_MSG') {
        const dmk = new DanmakuMessage(command);
        const medal = dmk.hasFansMedal
          ? `[${dmk.fansMedalName} ${dmk.fansMedalLevel}] `
          : '';
        const outs = `${medal}@${dmk.nickname}: ${dmk.message}`;
        if (dmk.message.substr(0, 2) === '!!' || dmk.message.substr(0, 2) === '！！')
          window.showInformationMessage(`@${dmk.nickname}: ${dmk.message.substr(2)}`);

        Logger.log(outs);
      }
    };
    this.liveClient.launch();
  }

  public stop() {
    this.liveClient?.stop();
  }
}
