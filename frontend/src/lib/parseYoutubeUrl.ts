export const parseYoutubeUrl = (url: string): string | null => {
  try {
    const u = new URL(url);
    const id = u.searchParams.get('list');
    return id || null;
  } catch {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  }
};
