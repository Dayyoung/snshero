/**
 * ImageDecoderWorker.ts - SCR-03-16
 * 카드 일러스트 이미지를 메인 스레드 대신 Web Worker에서 createImageBitmap으로 비동기 하드웨어 디코딩하는 Worker
 */

self.onmessage = async (e: MessageEvent<{ id: string; blob: Blob }>) => {
  const { id, blob } = e.data;
  try {
    const bitmap = await createImageBitmap(blob);
    // Transfer ImageBitmap ownership to main thread with 0-copy transfer
    (self as any).postMessage({ id, bitmap, success: true }, [bitmap]);
  } catch (err: any) {
    self.postMessage({ id, error: err.message, success: false });
  }
};
