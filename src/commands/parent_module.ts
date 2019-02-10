import * as vscode from 'coc.nvim';

import * as lc from 'vscode-languageserver-protocol';
import { Server } from '../server';

export async function handle() {
    const document = await vscode.workspace.document;
    if (document.filetype !== 'rust') {
        return;
    }
    const request: lc.TextDocumentPositionParams = {
        textDocument: { uri: document.uri.toString() },
        position: await vscode.workspace.getCursorPosition()
    };
    const response = await Server.client.sendRequest<lc.Location[]>(
        'rust-analyzer/parentModule',
        request
    );
    const loc = response[0];
    if (loc == null) {
        return;
    }

    await vscode.workspace.openResource(loc.uri)
    await vscode.workspace.nvim.call('setpos', ['.', loc.range.start.line, loc.range.start.character])
}
