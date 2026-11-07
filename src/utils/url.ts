/**
 * Returns the public accessible base URL for sharing.
 * Converts 'ais-dev-' to 'ais-pre-' so the links can be opened on any phone or device
 * without needing Google login or AI Studio developer credentials.
 */
export const getPublicBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    if (origin.includes('ais-pre-')) {
      return origin;
    }
    // If on localhost or preview wrapper, return the live public cloud run URL
    return 'https://ais-pre-6px2mapdgzd4vihfdxrxih-238304612385.asia-northeast1.run.app';
  }
  return 'https://ais-pre-6px2mapdgzd4vihfdxrxih-238304612385.asia-northeast1.run.app';
};
