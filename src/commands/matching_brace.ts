import * as vscode from 'coc.nvim';

import { Position, TextDocumentIdentifier } from 'vscode-languageserver-protocol';
import { Server } from '../server';
import { getSelectedRange, setSelectedRange } from './selection_helpers';

interface FindMatchingBraceParams {
    textDocument: TextDocumentIdentifier;
    offsets: Position[];
}

export async function handle() {
    const document = await vscode.workspace.document;
    if (document.filetype !== 'rust') {
        return;
    }
    const request: FindMatchingBraceParams = {
        textDocument: { uri: document.uri.toString() },
        offsets: [await vscode.workspace.getCursorPosition()]
    };
    const response = await Server.client.sendRequest<Position[]>(
        'rust-analyzer/findMatchingBrace',
        request
    );

    const active = response[0]
    const selRange = await getSelectedRange();
    let anchor;
    if (selRange === undefined) {
        anchor = active
    } else {
        anchor = selRange.start
    }
    setSelectedRange({ start: anchor, end: active });
}
