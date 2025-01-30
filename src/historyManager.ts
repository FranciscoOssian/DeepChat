import { Message } from "ollama";

let history: Message[] = [];

export function addToHistory(message: Message): void {
  history.push(message);
}

export function getHistory() {
  return history;
}

export function cleanHistory() {
  history = [];
}
