import * as vscode from 'coc.nvim';
import { Range ,TextDocumentPositionParams} from 'vscode-languageserver-protocol';
import * as lc from 'vscode-languageserver-types';
import Uri from 'vscode-uri'

import { Server } from '../server';

export interface SourceChange {
    label: string;
    workspaceEdit: lc.WorkspaceEdit;
    cursorPosition?: TextDocumentPositionParams;
}

// modified from coc.nvim/src/handler/index.ts
export async function getSelectedRange(): Promise<Range | undefined> {
    const mode = (await vscode.workspace.nvim.mode).mode;
    if (['v', 'V', 'char', 'line'].indexOf(mode) === -1) {
        vscode.workspace.showMessage(`Mode '${mode}' is not supported`, 'error')
        return
    }
    const { nvim } = vscode.workspace
    const isVisual = ['v', 'V'].indexOf(mode) !== -1
    let c = isVisual ? '<' : '['
    await nvim.command('normal! `' + c)
    const start = await vscode.workspace.getOffset()
    c = isVisual ? '>' : ']'
    await nvim.command('normal! `' + c)
    const end = await vscode.workspace.getOffset() + 1
    if (start == null || end == null || start === end) {
        vscode.workspace.showMessage(`Failed to get selected range`, 'error')
        return
    }
    const document = (await vscode.workspace.document).textDocument;
    return {
        start: document.positionAt(start),
        end: document.positionAt(end)
    }
}

export async function handle(change: SourceChange) {
    const wsEdit = Server.client.protocol2CodeConverter.asWorkspaceEdit(
        change.workspaceEdit
    );
    let created;
    let moved;
    if (change.workspaceEdit.documentChanges) {
        for (const docChange of change.workspaceEdit.documentChanges) {
            if (lc.CreateFile.is(docChange)) {
                created = docChange.uri;
            } else if (lc.RenameFile.is(docChange)) {
                moved = docChange.newUri;
            }
        }
    }
    const toOpen = created || moved;
    const toReveal = change.cursorPosition;
    await vscode.workspace.applyEdit(wsEdit);
    if (toOpen) {
        const toOpenUri = Uri.parse(toOpen);
        await vscode.workspace.readFile(toOpenUri.fsPath);
    } else if (toReveal) {
        const uri = Server.client.protocol2CodeConverter.asUri(
            toReveal.textDocument.uri
        );
        const position = Server.client.protocol2CodeConverter.asPosition(
            toReveal.position
        );
        const document = await vscode.workspace.document;
        if (!vscode.workspace || document.uri.toString() !== uri.toString()) {
            return;
        }
        const selection = await getSelectedRange()
        if (selection !== undefined) {
            return;
        }
        vscode.workspace.nvim.command(`call setpos('.', [${document.bufnr}, ${position.line}, ${position.cursor}, 0])`)
    }
}
