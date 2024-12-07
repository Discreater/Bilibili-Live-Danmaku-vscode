import type { MessageListener, MsgHandler } from 'blive-message-listener';
import { startListen } from 'blive-message-listener';
import { commands, env, Uri, window, workspace } from 'vscode';
import { COMMAND_UPDATE_POPULARITY } from './constants';
import { Logger } from './logger';

export default class Client {
  private static client?: Client;
  static get instance(): Client {
    return Client.client ?? (Client.client = new Client(3));
  }

  private constructor(public roomId: number) { }

  private liveClient?: MessageListener;

  public openRoomWebsite() {
    const url = `https://live.bilibili.com/${this.roomId}`;
    env.openExternal(Uri.parse(url));
  }

  public async launch() {
    const id = workspace.getConfiguration().get<number | null>('danmaku.Room ID', null);
    let parsedId;
    if (id === null || Number.isNaN(id)) {
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

      parsedId = Number(inputId);
    } else {
      parsedId = id;
    }
    this.roomId = parsedId;
    Logger.init();

    const handler: MsgHandler = {
      onClose: () => {
        Logger.log('已断开连接');
        commands.executeCommand(COMMAND_UPDATE_POPULARITY, null);
      },
      onError: (e) => {
        Logger.error(e.message);
      },
      onOpen: () => {
        Logger.log(`连接至房间 ${this.roomId}`);
      },
      onIncomeDanmu: (m) => {
        const { content, user, timestamp } = m.body;
        const userName = user.uname;
        const badge = user.badge?.name;
        const badgeFormatted = badge ? `[${badge}] ` : '';
        if (content.startsWith('!!') || content.startsWith('！！'))
          window.showInformationMessage(`${badgeFormatted}@${userName}: ${content.substring(2)}`);
        const dm = `${badgeFormatted}@${userName}: ${content}`;
        Logger.logWithTime(dm, timestamp);
      },
      onWatchedChange: (m) => {
        const pop = m.body.num;
        Logger.log(`pop ${pop}`);
        commands.executeCommand(COMMAND_UPDATE_POPULARITY, pop);
      },
    };

    this.liveClient = startListen(this.roomId, handler);
  }

  public stop() {
    this.liveClient?.close();
  }
}
