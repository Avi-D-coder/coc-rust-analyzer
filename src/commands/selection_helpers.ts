import * as vscode from 'coc.nvim';
import { Range } from 'vscode-languageserver-types';

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

export async function setSelectedRange(range: Range) {
    vscode.workspace.nvim.command(`
        call setpos('.',[0, ${range.start.line + 1}, ${range.start.character + 1}, 0])
        normal! v
        call setpos('.',[0, ${range.end.line + 1}, ${range.end.character + 1}, 0])`
    )
}
