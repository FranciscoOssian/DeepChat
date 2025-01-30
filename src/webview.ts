export function createWebviewContent(models: string[]): string {
  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <style>
          body{ font-family: sans-serif; margin: 1rem;}
          #prompt {width: 100%; box-sizing: border-box;}
          #response{border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; }
          #modelSelect {margin-top: 1rem; width: 100%;}

          .think {
            font-size: 6px;
          }

          .content-message{
          }


        </style>
      </head>
      <body>
        <h2>Deep VS Code Extension</h2>
        <select id="modelSelect">
          ${models
            .map((model) => `<option value="${model}">${model}</option>`)
            .join("")}
        </select>
        <textarea id="prompt" rows="3" placeholder="Ask..."></textarea>
        <button id="askBtn">Ask</button>
        <button id="cleanBtn">Clean conversation</button>
        <div id="response">
            <ul id="messages"></ul>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          
          let lastModelMessageLI;
          let lastModelMessageLI_THINK;
          let lastModelMessageLI_CONTENT;

          document.getElementById('askBtn').addEventListener("click", () => {
            const text = document.getElementById('prompt').value;
            lastModelMessageLI = document.createElement('li');
            lastModelMessageLI.innerHTML = text;
            document.getElementById('messages').appendChild(lastModelMessageLI);
            lastModelMessageLI = null;
            document.getElementById('prompt').value = '';
            vscode.postMessage({command: "chat", text});
          });

          document.getElementById('cleanBtn').addEventListener("click", () => {
            vscode.postMessage({command: "cleanConversation"});
            document.getElementById('messages').innerHTML = '';
          });

          document.getElementById('modelSelect').addEventListener("change", (e) => {
            const selectedModel = e.target.value;
            vscode.postMessage({command: "selectModel", model: selectedModel});
          });

          window.addEventListener('message', event => {
            const {command, message} = event.data;
            
            if(command === 'chatResponse:started'){
              lastModelMessageLI = document.createElement('li');
              lastModelMessageLI_THINK = document.createElement('div');
              lastModelMessageLI_CONTENT = document.createElement('div');
              lastModelMessageLI_THINK.classList.add('think');
              lastModelMessageLI_CONTENT.classList.add('content-message');
              lastModelMessageLI.appendChild(lastModelMessageLI_THINK);
              lastModelMessageLI.appendChild(lastModelMessageLI_CONTENT);
              document.getElementById('messages').appendChild(lastModelMessageLI);
            }

            if (command === 'chatResponse:stream') {
              if (lastModelMessageLI) {
                if (message && message.content) {
                  lastModelMessageLI_THINK.innerHTML = message.content.think || '';
                  lastModelMessageLI_CONTENT.innerHTML = message.content.content || '';
                }
              } else {
                console.warn('Nenhuma mensagem inicializada para o stream!');
              }
            }

            if(command === 'chatResponse:finished'){
              lastModelMessageLI = null; // Limpa a referência após o fim
            }
          });

        </script>
      </body>
    </html>
  `;
}
