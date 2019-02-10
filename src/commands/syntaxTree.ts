// import * as vscode from 'coc.nvim';
// import { TextDocumentIdentifier } from 'vscode-languageserver-types';

// import Uri from 'vscode-uri';
// import { Server } from '../server';

// export const syntaxTreeUri = Uri.parse('rust-analyzer://syntaxtree');

// export class TextDocumentContentProvider
//     implements vscode.TextDocumentContentProvider {
//     public eventEmitter = new vscode.EventEmitter<vscode.Uri>();
//     public syntaxTree: string = 'Not available';

//     public async provideTextDocumentContent(
//         uri: Uri
//     ): Promise<vscode.ProviderResult<string>> {
//         const document = vscode.workspace.document;
//         if (document == null) {
//             return '';
//         }
//         const request: SyntaxTreeParams = {
//             textDocument: { uri: editor.document.uri.toString() }
//         };
//         return Server.client.sendRequest<SyntaxTreeResult>(
//             'rust-analyzer/syntaxTree',
//             request
//         );
//     }

//     get onDidChange(): vscode.Event<vscode.Uri> {
//         return this.eventEmitter.event;
//     }
// }

// interface SyntaxTreeParams {
//     textDocument: TextDocumentIdentifier;
// }

// type SyntaxTreeResult = string;

// // Opens the virtual file that will show the syntax tree
// //
// // The contents of the file come from the `TextDocumentContentProvider`
// export async function handle() {
//     const document = await vscode.workspace.openTextDocument(syntaxTreeUri);
//     return vscode.window.showTextDocument(
//         document,
//         vscode.ViewColumn.Two,
//         true
//     );
// }
