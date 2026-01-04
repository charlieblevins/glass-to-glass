// the main way of sending data round the app
export function dispatch<T>(
  eName: string,
  detail?: Record<string, unknown> | T
) {
  if (!detail) {
    return document.dispatchEvent(new CustomEvent(eName));
  }

  return document.dispatchEvent(new CustomEvent(eName, { detail }));
}
