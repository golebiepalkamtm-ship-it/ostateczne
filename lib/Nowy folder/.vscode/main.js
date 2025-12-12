/// <reference path="c:/Users/Marcin_Palka/.vscode/extensions/nur.script-0.2.1/@types/api.global.d.ts" />
/// <reference path="c:/Users/Marcin_Palka/.vscode/extensions/nur.script-0.2.1/@types/vscode.global.d.ts" />
//  @ts-check
//  API: https://code.visualstudio.com/api/references/vscode-api

// Dodaj Puter.js script
const puterScript = document.createElement('script');
puterScript.src = 'https://js.puter.com/v2/';
document.head.appendChild(puterScript);

function activate(_context) {
   window.showInformationMessage('Hello, World! Claude AI Extension Loaded.');

   // Rejestracja komendy: Generuj kod z Claude
   vscode.commands.registerCommand('claude.generateCode', async () => {
       const editor = vscode.window.activeTextEditor;
       if (!editor) {
           vscode.window.showErrorMessage('Brak aktywnego edytora.');
           return;
       }

       const selection = editor.selection;
       const selectedText = editor.document.getText(selection);
       const prompt = await vscode.window.showInputBox({
           prompt: 'Wpisz prompt dla Claude (np. "Refaktoruj ten kod")',
           value: selectedText || 'Napisz funkcję React',
       });

       if (!prompt) return;

       try {
           const generatedCode = await generateWithClaude(prompt);
           editor.edit(editBuilder => {
               editBuilder.replace(selection, generatedCode);
           });
           vscode.window.showInformationMessage('Kod wygenerowany przez Claude!');
       } catch (error) {
           vscode.window.showErrorMessage(`Błąd: ${error.message}`);
       }
   });

   // Rejestracja komendy: Wyjaśnij kod
   vscode.commands.registerCommand('claude.explainCode', async () => {
       const editor = vscode.window.activeTextEditor;
       if (!editor) return;

       const selection = editor.selection;
       const selectedText = editor.document.getText(selection);
       if (!selectedText) {
           vscode.window.showErrorMessage('Zaznacz kod do wyjaśnienia.');
           return;
       }

       try {
           const explanation = await explainWithClaude(selectedText);
           vscode.window.showInformationMessage(explanation);
       } catch (error) {
           vscode.window.showErrorMessage(`Błąd: ${error.message}`);
       }
   });
}

async function generateWithClaude(prompt, model = 'claude-sonnet-4-5') {
   if (!window.puter?.ai?.chat) {
       throw new Error('Puter.js nie załadowany. Odśwież VS Code.');
   }
   const response = await window.puter.ai.chat(prompt, { model });
   return response.message.content[0].text;
}

async function explainWithClaude(code, model = 'claude-haiku-4-5') {
   if (!window.puter?.ai?.chat) {
       throw new Error('Puter.js nie załadowany. Odśwież VS Code.');
   }
   const prompt = `Wyjaśnij ten kod w prosty sposób: ${code}`;
   const response = await window.puter.ai.chat(prompt, { model });
   return response.message.content[0].text;
}

function deactivate() {}
