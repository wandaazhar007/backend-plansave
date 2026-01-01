export function encodeCursor(obj) {
  const json = JSON.stringify(obj);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeCursor(cursor) {
  try {
    const json = Buffer.from(String(cursor), "base64url").toString("utf8");
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;
    return obj;
  } catch {
    return null;
  }
}