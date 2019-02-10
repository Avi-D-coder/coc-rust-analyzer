import * as vscode from 'coc.nvim';
import {Emitter, Event} from 'vscode-languageserver-protocol';
import Uri from 'vscode-uri';
import { Server } from '../server';

const statusUri = Uri.parse('rust-analyzer-status://status');

export class TextDocumentContentProvider
    implements vscode.TextDocumentContentProvider {
    public syntaxTree: string = 'Not available';
    public eventEmitter = new Emitter<Uri>();

    public provideTextDocumentContent(
        uri: Uri
    ): vscode.ProviderResult<string> {
        return Server.client.sendRequest<string>(
            'rust-analyzer/analyzerStatus',
            null
        ) as vscode.ProviderResult<string>;
    }

    get onDidChange(): Event<Uri> {
        return this.eventEmitter.event;
    }
}

let poller: NodeJS.Timer | null = null;

// Shows status of rust-analyzer (for debugging)

export function makeCommand(context: vscode.ExtensionContext) {
    const textDocumentContentProvider = new TextDocumentContentProvider();
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(
            'rust-analyzer-status',
            textDocumentContentProvider
        )
    );

    context.subscriptions.push({
        dispose() {
            if (poller != null) {
                clearInterval(poller);
            }
        }
    });

    return async function handle() {
        if (poller == null) {
            poller = setInterval(
                () => textDocumentContentProvider.eventEmitter.fire(statusUri),
                1000
            );
        }
        const document = await vscode.workspace.readFile(statusUri.fsPath);
        return vscode.workspace.openResource(
            document,
        );
    };
}
