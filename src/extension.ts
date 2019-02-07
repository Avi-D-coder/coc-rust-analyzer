import * as vscode from 'vscode';
import * as lc from 'vscode-languageclient';

import * as commands from './commands';
import { TextDocumentContentProvider } from './commands/syntaxTree';
import * as events from './events';
import * as notifications from './notifications';
import { Server } from './server';

export function activate(context: vscode.ExtensionContext) {
    function disposeOnDeactivation(disposable: vscode.Disposable) {
        context.subscriptions.push(disposable);
    }

    function registerCommand(name: string, f: any) {
        disposeOnDeactivation(vscode.commands.registerCommand(name, f));
    }
    function overrideCommand(
        name: string,
        f: (...args: any[]) => Promise<boolean>
    ) {
        const defaultCmd = `default:${name}`;
        const original = (...args: any[]) =>
            vscode.commands.executeCommand(defaultCmd, ...args);

        try {
            registerCommand(name, async (...args: any[]) => {
                const editor = vscode.window.activeTextEditor;
                if (
                    !editor ||
                    !editor.document ||
                    editor.document.languageId !== 'rust'
                ) {
                    return await original(...args);
                }
                if (!(await f(...args))) {
                    return await original(...args);
                }
            });
        } catch (_) {
            vscode.window.showWarningMessage(
                'Enhanced typing feature is disabled because of incompatibility with VIM extension'
            );
        }
    }

    // Commands are requests from vscode to the language server
    registerCommand(
        'rust-analyzer.analyzerStatus',
        commands.analyzerStatus.makeCommand(context)
    );
    registerCommand('rust-analyzer.collectGarbage', () =>
        Server.client.sendRequest<null>('rust-analyzer/collectGarbage', null)
    );
    registerCommand('rust-analyzer.syntaxTree', commands.syntaxTree.handle);
    registerCommand(
        'rust-analyzer.extendSelection',
        commands.extendSelection.handle
    );
    registerCommand(
        'rust-analyzer.matchingBrace',
        commands.matchingBrace.handle
    );
    registerCommand('rust-analyzer.joinLines', commands.joinLines.handle);
    registerCommand('rust-analyzer.parentModule', commands.parentModule.handle);
    registerCommand('rust-analyzer.run', commands.runnables.handle);
    // Unlike the above this does not send requests to the language server
    registerCommand('rust-analyzer.runSingle', commands.runnables.handleSingle);
    registerCommand(
        'rust-analyzer.applySourceChange',
        commands.applySourceChange.handle
    );
    registerCommand(
        'rust-analyzer.showReferences',
        (uri: string, position: lc.Position, locations: lc.Location[]) => {
            vscode.commands.executeCommand(
                'editor.action.showReferences',
                vscode.Uri.parse(uri),
                Server.client.protocol2CodeConverter.asPosition(position),
                locations.map(Server.client.protocol2CodeConverter.asLocation)
            );
        }
    );

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

    // The events below are plain old javascript events, triggered and handled by vscode
    vscode.window.onDidChangeActiveTextEditor(
        events.changeActiveTextEditor.handle
    );

    const textDocumentContentProvider = new TextDocumentContentProvider();
    disposeOnDeactivation(
        vscode.workspace.registerTextDocumentContentProvider(
            'rust-analyzer',
            textDocumentContentProvider
        )
    );

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
