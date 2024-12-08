import * as vscode from 'vscode';
import Client from './client';
import { COMMAND_LAUNCH, COMMAND_OPEN_LIVE_ROOM, COMMAND_RELAUNCH, COMMAND_STOP, COMMAND_UPDATE_POPULARITY, DANMAKU_VIEW } from './constants';

class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = DANMAKU_VIEW;

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        this._extensionUri,
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case 'colorSelected':
        {
          vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
          break;
        }
      }
    });
  }

  public addColor() {
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({ type: 'addColor' });
    }
  }

  public clearColors() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'clearColors' });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">

        <!--
          Use a content security policy to only allow loading styles from our extension directory,
          and only allow scripts that have a specific nonce.
          (See the 'webview-sample' extension sample for img-src content security policy examples)
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">

        <title>Cat Colors</title>
      </head>
      <body>
        <ul class="color-list">
        </ul>

        <button class="add-color-button">Add Color</button>

        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}
export function activate(context: vscode.ExtensionContext) {
  const provider = new ColorsViewProvider(context.extensionUri);

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider));

  const launch = vscode.commands.registerCommand(
    COMMAND_LAUNCH,
    () => {
      provider.addColor();
      // Client.instance.stop();
      // Client.instance.launch();
    },
  );

  const relaunch = vscode.commands.registerCommand(
    COMMAND_RELAUNCH,
    () => {
      Client.instance.stop();
      Client.instance.launch();
    },
  );

  const stop = vscode.commands.registerCommand(
    COMMAND_STOP,
    () => {
      Client.instance.stop();
    },
  );

  const _openLiveRoom = vscode.commands.registerCommand(
    COMMAND_OPEN_LIVE_ROOM,
    () => {
      Client.instance.openRoomWebsite();
    },
  );

  context.subscriptions.push(launch, relaunch, stop);

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
  );
  statusBarItem.command = COMMAND_OPEN_LIVE_ROOM;
  const updatePopularity = vscode.commands.registerCommand(
    COMMAND_UPDATE_POPULARITY,
    (popularity) => {
      if (popularity === null) {
        statusBarItem.hide();
      } else {
        statusBarItem.text = `$(person) popularity: ${popularity}`;
        statusBarItem.show();
      }
    },
  );
  statusBarItem.hide();
  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(updatePopularity);
}

export function deactivate() {
  Client.instance.stop();
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
