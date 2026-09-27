export async function copyText(text, clipboard = globalThis.navigator?.clipboard) {
  try {
    if (!clipboard?.writeText) throw new Error('Clipboard no disponible');
    await clipboard.writeText(text);
    return { copied: true, text };
  } catch {
    return { copied: false, text, message: 'No se pudo copiar. Selecciona el texto y cópialo manualmente.' };
  }
}
