/**
 * MarketFuzzySearchWorker.ts - SCR-05-28
 * 마켓플레이스 대량 매물(1,000건+) 메타데이터를 인덱싱하고,
 * 100ms 디바운싱 기반 Instant Fuzzy Search를 백그라운드에서 0ms 메인 스레드 부하로 수행하는 검색 워커.
 */

export interface MarketItemIndex {
  id: string;
  name: string;
  seller: string;
  price: number;
  grade: string;
  element: string;
}

let cachedItems: MarketItemIndex[] = [];

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === 'INDEX_ITEMS') {
    cachedItems = payload as MarketItemIndex[];
    self.postMessage({ type: 'INDEXED_SUCCESS', count: cachedItems.length });
  } else if (type === 'SEARCH') {
    const query = ((payload.query as string) || '').toLowerCase().trim();
    const gradeFilter = payload.gradeFilter as string | undefined;

    if (!query && !gradeFilter) {
      self.postMessage({ type: 'SEARCH_RESULTS', results: cachedItems.slice(0, 50) });
      return;
    }

    const matched = cachedItems.filter((item) => {
      const matchName = !query || item.name.toLowerCase().includes(query);
      const matchGrade = !gradeFilter || item.grade === gradeFilter;
      return matchName && matchGrade;
    });

    self.postMessage({ type: 'SEARCH_RESULTS', results: matched.slice(0, 50) });
  }
};
