import * as vscode from "vscode";
import Client from "./client";
import { COMMAND_LAUNCH, COMMAND_RELAUNCH, COMMAND_STOP, COMMAND_OPEN_LIVE_ROOM, COMMAND_UPDATE_POPULARITY } from "./constants";

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  const launch = vscode.commands.registerCommand(
    COMMAND_LAUNCH,
    () => {
      Client.instance.launch();
    }
  );

  const relaunch = vscode.commands.registerCommand(
    COMMAND_RELAUNCH,
    () => {
      Client.instance.stop();
      Client.instance.launch();
    }
  );

  const stop = vscode.commands.registerCommand(
    COMMAND_STOP,
    () => {
      Client.instance.stop();
    }
  );

  const openLiveRoom = vscode.commands.registerCommand(
    COMMAND_OPEN_LIVE_ROOM,
    () => {
      Client.instance.openRoomWebsite();
    }
  );

  context.subscriptions.push(launch, relaunch, stop);

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
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
    }
  );
  statusBarItem.hide();
  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(updatePopularity);
}

export function deactivate() {
  Client.instance.stop();
  statusBarItem.dispose();
}
