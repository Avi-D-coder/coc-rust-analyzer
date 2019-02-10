import * as vscode from 'coc.nvim';
import { TextDocumentPositionParams } from 'vscode-languageserver-protocol';
import * as lc from 'vscode-languageserver-types';
import Uri from 'vscode-uri'

export interface SourceChange {
    label: string;
    workspaceEdit: lc.WorkspaceEdit;
    cursorPosition?: TextDocumentPositionParams;
}

export async function handle(change: SourceChange) {
    const wsEdit = change.workspaceEdit
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
        const uri = toReveal.textDocument.uri
        const position = toReveal.position
        const document = await vscode.workspace.document;
        if (!vscode.workspace || document.uri.toString() !== uri.toString()) {
            return;
        }
        vscode.workspace.nvim.command(`call setpos('.', [${document.bufnr}, ${position.line + 1}, ${position.character + 1}, 0])`)
    }
}
