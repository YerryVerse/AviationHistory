const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";


export function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}


export function withBasePath(path: string, basePath = configuredBasePath): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith("//")) {
    throw new Error(`Static asset paths must be same-origin: ${path}`);
  }
  const normalizedBase = normalizeBasePath(basePath);
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  if (normalizedBase && (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`))) {
    return normalizedPath;
  }
  return `${normalizedBase}${normalizedPath}`;
}
