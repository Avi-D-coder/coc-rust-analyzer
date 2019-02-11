import * as vscode from 'coc.nvim';

import { Range, TextDocumentIdentifier } from 'vscode-languageserver-types';
import { Server } from '../server';
import { getSelectedRange, setSelectedRange } from './selection_helpers'

interface ExtendSelectionParams {
    textDocument: TextDocumentIdentifier;
    selections: Range[];
}

interface ExtendSelectionResult {
    selections: Range[];
}

export async function handle() {
    const document = await vscode.workspace.document;
    const selection = await getSelectedRange();
    if (document.filetype !== 'rust') {
        return;
    }
    const request: ExtendSelectionParams = {
        // TODO handle multiple selections
        selections: [selection],
        textDocument: { uri: document.uri }
    };
    const response = await Server.client.sendRequest<ExtendSelectionResult>(
        'rust-analyzer/extendSelection',
        request
    );
    await setSelectedRange(response.selections[0])
}
