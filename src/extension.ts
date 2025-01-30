import * as vscode from "vscode";
import ollama from "ollama";
import { createWebviewContent } from "./webview";
import { getAvailableModels } from "./modelManager";
import { addToHistory, cleanHistory, getHistory } from "./historyManager";
import { marked } from "marked";
import { extractThinkAndOtherText } from "./utils";
import { exec } from "child_process";

export function activate(context: vscode.ExtensionContext) {
  let selectedModel = "deepseek-r1:7b"; // Default model

  exec("ollama --version", (error, stdout, stderr) => {
    if (error) {
      vscode.window.showInformationMessage("You need Ollama CLI instaled.");
      console.error(`Erro ao verificar CLI: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erro no stderr: ${stderr}`);
      return;
    }
    console.log(`Versão da CLI Ollama: ${stdout}`);
  });

  // Get available models from the Lama repository
  const availableModels = getAvailableModels();

  const disposable = vscode.commands.registerCommand(
    "deepchat.helloWorld",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "deepChat",
        "Deep Chat",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      // Set webview HTML content
      panel.webview.html = createWebviewContent(availableModels);

      // Handle messages from webview
      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "cleanConversation") {
          cleanHistory();
        }

        if (message.command === "selectModel") {
          selectedModel = message.model;

          ollama.list().then(async (list) => {
            let has = false;
            for (let item of list["models"]) {
              if (item.name === selectedModel) {
                has = true;
              }
            }
            if (!has) {
              try {
                const result = await vscode.window.showInformationMessage(
                  "Do you want to download this model?",
                  "Yes",
                  "No"
                );
                if (result === "Yes") {
                  const streamResponse = await ollama.pull({
                    model: selectedModel,
                    stream: true,
                  });
                  await vscode.window.showInformationMessage("downloading");
                  for await (const _ of streamResponse) {
                    //panel.webview.postMessage({
                    //  command: "pull:started",
                    // stream: stream,
                    //});
                  }
                  await vscode.window.showInformationMessage("Model saved");
                }
              } catch (err) {}
            }
          });
        }

        if (message.command === "chat") {
          const userPrompt = message.text;
          addToHistory({ role: "user", content: userPrompt });
          let responseText = "";

          try {
            panel.webview.postMessage({
              command: "chatResponse:started",
            });
            const streamResponse = await ollama.chat({
              model: selectedModel,
              messages: getHistory(),
              stream: true,
            });
            for await (const part of streamResponse) {
              responseText += part.message.content;
              const { content, think } = extractThinkAndOtherText(
                await marked(responseText)
              );
              panel.webview.postMessage({
                command: "chatResponse:stream",
                message: { role: "model", content: { think, content } },
              });
            }
            panel.webview.postMessage({
              command: "chatResponse:finished",
            });
            addToHistory({ role: "model", content: responseText });
          } catch (err) {
            console.error(err);
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  ollama.abort();
}
