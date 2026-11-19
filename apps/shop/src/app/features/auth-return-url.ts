export function safeReturnUrl(requestedUrl: string | null | undefined): string {
  return requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//') ? requestedUrl : '/';
}
