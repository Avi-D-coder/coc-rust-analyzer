import * as vscode from 'coc.nvim';
import { Range } from 'vscode-languageserver-types';

// modified from coc.nvim/src/handler/index.ts
export async function getSelectedRange(): Promise<Range> {
    const fallback = async () => {
        const pos = await vscode.workspace.getCursorPosition();
        return {
            start: pos,
            end: { line: pos.line, character: pos.character },
        }
    };
    const { nvim } = vscode.workspace
    const modeBroken = (await vscode.workspace.nvim.mode).mode;
    const mode: string = await nvim.call('mode', [])
    vscode.workspace.echoLines([mode, modeBroken])
    if (['v', 'V', 'char', 'line'].indexOf(mode) === -1) {
        return fallback()
    }
    const isVisual = ['v', 'V'].indexOf(mode) !== -1
    const sm = isVisual ? '<' : '['
    const em = isVisual ? '>' : ']'
    const start: number[] = await nvim.call('getpos', `'${sm}`);
    const end: number[] = await nvim.call('getpos', `'${em}`);
    if (!start || !end || start === end) {
        return fallback()
    }
    // TODO handle astral characters
    return {
        start: { line: start[1] - 1, character: start[2] - 1 },
        end: { line: end[1] - 1, character: end[2] - 1 }
    }
}

export async function setSelectedRange(range: Range) {
    const { nvim } = vscode.workspace;
    await nvim.call('setpos', [`'<`, [0, range.start.line + 1, range.start.character + 1]])
    await nvim.call('setpos', [`'>`, [0, range.end.line + 1, range.end.character + 1]])
    nvim.command('normal! gv')
}
