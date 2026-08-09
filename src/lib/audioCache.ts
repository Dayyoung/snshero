// Audio Buffer & Asset Caching Utility (Items #113, #121)
const audioBufferCache = new Map<string, ArrayBuffer>();

export async function prefetchAudioTrack(url: string): Promise<void> {
  if (audioBufferCache.has(url)) return;
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      audioBufferCache.set(url, buf);
    }
  } catch (err) {
    // Gracefully handle offline or CORS errors
  }
}

export function getCachedAudioBuffer(url: string): ArrayBuffer | undefined {
  return audioBufferCache.get(url);
}

// Pre-cache critical audio tracks on app init
export function initAudioCache() {
  const criticalAudio = [
    'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
    'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'
  ];
  criticalAudio.forEach(prefetchAudioTrack);
}
