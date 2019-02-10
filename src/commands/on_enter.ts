import * as vscode from 'coc.nvim';
import * as lc from 'vscode-languageserver-protocol';
import { Server } from '../server';
import {
    handle as applySourceChange,
    SourceChange
} from './apply_source_change';

export async function handle(event: { text: string }): Promise<boolean> {
    const document = await vscode.workspace.document;
    if (
        document.filetype !== 'rust' ||
        event.text !== '\n'
    ) {
        return false;
    }
    const request: lc.TextDocumentPositionParams = {
        textDocument: { uri: document.uri.toString() },
        position: Server.client.code2ProtocolConverter.asPosition(
            vscode.workspace.getOffset()
        )
    };
    const change = await Server.client.sendRequest<undefined | SourceChange>(
        'rust-analyzer/onEnter',
        request
    );
    if (!change) {
        return false;
    }
    await applySourceChange(change);
    return true;
}
