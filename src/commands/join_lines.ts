import * as vscode from 'coc.nvim';

import { Range, TextDocumentIdentifier } from 'vscode-languageserver-protocol';
import { Server } from '../server';
import {
    handle as applySourceChange,
    SourceChange
} from './apply_source_change';
import { getSelectedRange } from './selection_helpers';

interface JoinLinesParams {
    textDocument: TextDocumentIdentifier;
    range: Range;
}

export async function handle() {
    const document = await vscode.workspace.document;
    if (document.filetype !== 'rust') {
        return;
    }
    const request: JoinLinesParams = {
        range: await getSelectedRange(),
        textDocument: { uri: document.uri.toString() }
    };
    const change = await Server.client.sendRequest<SourceChange>(
        'rust-analyzer/joinLines',
        request
    );
    await applySourceChange(change);
}
