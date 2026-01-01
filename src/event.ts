// the main way of sending data round the app
export function dispatch(eName: string, detail?: Record<string, unknown>) {
  if (!detail) {
    return document.dispatchEvent(new CustomEvent(eName));
  }

  return document.dispatchEvent(new CustomEvent(eName, { detail }));
}
