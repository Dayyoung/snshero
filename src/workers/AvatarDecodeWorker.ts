/**
 * AvatarDecodeWorker.ts - SCR-10-16
 * 랭킹 고속 스크롤 시 커스텀 아바타를 백그라운드에서 비동기 디코딩하는 Web Worker
 */

self.onmessage = async (e: MessageEvent<{ url: string; id: string }>) => {
  const { url, id } = e.data;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    (self as any).postMessage({ id, bitmap }, [bitmap]);
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
