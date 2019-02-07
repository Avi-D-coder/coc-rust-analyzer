import * as vscode from 'coc.nvim';
import * as lc from 'vscode-languageclient';

import * as commands from './commands';
import { TextDocumentContentProvider } from './commands/syntaxTree';
import * as events from './events';
import * as notifications from './notifications';
import { Server } from './server';

export async function activate(context: vscode.ExtensionContext) {

  // Commands are requests from vscode to the language server
  vscode.commands.registerCommand(
    'rust-analyzer.analyzerStatus',
    commands.analyzerStatus.makeCommand(context)
  );
  vscode.commands.registerCommand('rust-analyzer.collectGarbage', () =>
    Server.client.sendRequest<null>('rust-analyzer/collectGarbage', null)
  );
  vscode.commands.registerCommand('rust-analyzer.syntaxTree', commands.syntaxTree.handle);
  vscode.commands.registerCommand(
    'rust-analyzer.extendSelection',
    commands.extendSelection.handle
  );
  vscode.commands.registerCommand(
    'rust-analyzer.matchingBrace',
    commands.matchingBrace.handle
  );
  vscode.commands.registerCommand('rust-analyzer.joinLines', commands.joinLines.handle);
  vscode.commands.registerCommand('rust-analyzer.parentModule', commands.parentModule.handle);
  vscode.commands.registerCommand('rust-analyzer.run', commands.runnables.handle);
  // Unlike the above this does not send requests to the language server
  vscode.commands.registerCommand('rust-analyzer.runSingle', commands.runnables.handleSingle);
  vscode.commands.registerCommand(
    'rust-analyzer.applySourceChange',
    commands.applySourceChange.handle
  );

  vscode.commands.registerCommand(
    'rust-analyzer.showReferences',
    async () => {
      const position = await vscode.workspace.getCursorPosition()
      const document = await vscode.workspace.document
      // FIXME does this work?
      let locations: lc.Location[] = []
      vscode.commands.executeCommand(
        'editor.action.showReferences',
        document.uri,
        position,
        locations
      );
    }
  );
  function overrideCommand(
    name: string,
    f: (...args: any[]) => Promise<boolean>
  ) {
    const defaultCmd = `default:${name}`;
    const original = (...args: any[]) =>
      vscode.commands.executeCommand(defaultCmd, ...args);

    try {
      vscode.commands.registerCommand(name, async (...args: any[]) => {
        const document = await vscode.workspace.document
        if (
          !document ||
          document.filetype !== 'rust'
        ) {
          return await original(...args);
        }
        if (!(await f(...args))) {
          return await original(...args);
        }
      });
    } catch (_) {
      console.error("overrideCommand does not work")
    }
  }

  overrideCommand('type', commands.onEnter.handle);

  // Notifications are events triggered by the language server
  const allNotifications: Iterable<
    [string, lc.GenericNotificationHandler]
    > = [
      [
        'rust-analyzer/publishDecorations',
        notifications.publishDecorations.handle
      ]
    ];

  // TODO semantic highlighting
  // The events below are plain old javascript events, triggered and handled by vscode
  // vscode.window.onDidChangeActiveTextEditor(
  //   events.changeActiveTextEditor.handle
  // );

  const textDocumentContentProvider = new TextDocumentContentProvider();
  // TODO for when Coc gets dispose support
  // disposeOnDeactivation(
  //   vscode.workspace.registerTextDocumentContentProvider(
  //     'rust-analyzer',
  //     textDocumentContentProvider
  //   )
  // );

  vscode.workspace.onDidChangeTextDocument(
    events.changeTextDocument.createHandler(textDocumentContentProvider),
    null,
    context.subscriptions
  );

  // Start the language server, finally!
  Server.start(allNotifications);
}

export function deactivate(): Thenable<void> {
  if (!Server.client) {
    return Promise.resolve();
  }
  return Server.client.stop();
}
