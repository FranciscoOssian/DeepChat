export function extractThinkAndOtherText(message: string) {
  const indexOfThink1 = message.indexOf("<think>");
  const indexOfThink2 = message.indexOf("</think>");

  if (
    indexOfThink1 === -1 ||
    indexOfThink2 === -1 ||
    indexOfThink1 > indexOfThink2
  ) {
    // Se não encontrar a tag <think> ou </think>, ou se a ordem das tags estiver errada
    return {
      think: message,
      content: "",
    };
  } else {
    // Extrair o conteúdo dentro de <think>...</think>
    const thinkContent = message.slice(indexOfThink1 + 7, indexOfThink2); // 7 é o tamanho de "<think>"

    // Extrair o conteúdo após a tag </think>
    const contentAfterThink = message.slice(indexOfThink2 + 8); // 8 é o tamanho de "</think>"

    return {
      think: thinkContent, // Conteúdo dentro da tag <think>
      content: contentAfterThink, // O restante da string após </think>
    };
  }
}
