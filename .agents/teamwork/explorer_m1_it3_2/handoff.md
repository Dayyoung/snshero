# Milestone 1 Iteration 3: Downstream Generators Handoff Report
**Target**: Downstream Generators (`scripts/generate-news-seo.ts` & `scripts/generate-video-seo.ts`)
**Author**: Explorer 2 (`explorer_m1_it3_2`)
**Recipient**: Orchestrator (`21826d14-7bc9-4995-866c-cbb42a941789`) & Worker M1-it3
**Date**: 2026-11-02T18:01:00Z
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_2/`
**Report Reference**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_2/report.md`

---

## 1. Observation

1. **Inspection of `scripts/generate-video-seo.ts`**:
   - Lines 700–711:
     ```typescript
     function writeHtmlToPublicAndDist(relDir: string, html: string) {
       const targets = [path.join(publicDir, relDir)];
       if (fs.existsSync(distDir)) {
         targets.push(path.join(distDir, relDir));
       }
       for (const dir of targets) {
         if (!fs.existsSync(dir)) {
           fs.mkdirSync(dir, { recursive: true });
         }
         fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
       }
     }
     ```
   - Invocations (lines 734–745): `writeHtmlToPublicAndDist` is called for `movie`, `animation`, `cinema`, and all 40 episodes `path.join('movie', `ep-${ep.episodeNumber}`)` and `path.join('cinema', `ep-${ep.episodeNumber}`)`.
   - Result: Emits `dist/movie/ep-1/index.html` through `dist/movie/ep-40/index.html` and `dist/cinema/ep-1/index.html` through `dist/cinema/ep-40/index.html`.
   - Verified via filesystem scan: Command `find dist/movie dist/cinema -name "*.html" ! -name "index.html"` returns **0 files**. Zero extensionless `.html` files exist for video episodes (`ep-1.html` .. `ep-40.html`).

2. **Inspection of `scripts/generate-news-seo.ts`**:
   - Article comments generation (lines 681–697):
     ```typescript
     for (const aliasId of idAliases) {
       const targetDirs: string[] = [];
       if (fs.existsSync(distDir)) {
         targetDirs.push(
           path.join(distDir, 'r', 'news', 'comments', aliasId),
           path.join(distDir, 'reddit', 'comments', aliasId)
         );
       }
       for (const dir of targetDirs) {
         if (!fs.existsSync(dir)) {
           fs.mkdirSync(dir, { recursive: true });
         }
         fs.writeFileSync(path.join(dir, 'index.html'), articleHtml, 'utf8');
       }
     }
     ```
   - Feed hub generation (lines 704–720): Writes `dist/reddit/index.html` and `dist/r/news/index.html`.
   - Pruning logic (lines 658–665): Explicitly removes `public/r/news/comments` and `public/reddit/comments` so news comments only exist in `dist/`.
   - Verified via filesystem scan: Command `find dist/r/news dist/reddit/comments -name "*.html" ! -name "index.html"` returns **0 files**. `dist/r/news.html` does NOT exist (`ls -la dist/r/news.html` exits with code 1).

3. **Comparison with Post-Build Routes (`/r/hanguk` and `/r/hanguk/comments/post_vibecoding_master`)**:
   - In `scripts/post-build.js` lines 79–100, `routes` includes `'r/hanguk'` and `'r/hanguk/comments/post_vibecoding_master'`.
   - Lines 289–306:
     ```javascript
     fs.writeFileSync(path.join(routeDir, 'index.html'), targetHtml, 'utf8');
     ...
     fs.writeFileSync(flatHtmlPath, targetHtml, 'utf8');
     ```
   - Verified via command `ls -la dist/r/hanguk.html dist/r/hanguk/comments/post_vibecoding_master.html`: Both files exist.
   - Live HTTP probe on port 3000:
     - `curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'` -> `id="root"` (200 OK directly, no redirect).
     - `curl -s http://localhost:3000/r/hanguk/comments/post_vibecoding_master | grep -o 'id="[^"]*"'` -> `id="root"` (200 OK directly).

4. **Live Empirical Failure of Downstream News Routes on Port 3000**:
   - `dist/sitemap-news.xml` line 5 publishes clean URL: `<loc>https://snshero.com/r/news/comments/gnews_1793608080000_0</loc>`.
   - Command: `curl -s http://localhost:3000/r/news/comments/gnews_1793608080000_0 | grep -o 'id="[^"]*"'`
     - Result: `id="landing-root"` (Content-Length: 44,977 bytes, ETag `W/"afb1-7bbw+fV1u9ERUHO29rcc0aV0/Hk"`, exactly `dist/index.html`).
   - Command: `curl -s http://localhost:3000/r/news/comments/gnews_0 | grep -o 'id="[^"]*"'`
     - Result: `id="landing-root"`.
   - Command with trailing slash: `curl -s http://localhost:3000/r/news/comments/gnews_0/ | grep -o 'id="[^"]*"'`
     - Result: `id="root"`.

---

## 2. Logic Chain

1. From Observation 3, when both `dist/[route]/index.html` AND `dist/[route].html` exist (as implemented for `post-build.js` routes), static web servers (Vite preview, Nginx, Cloudflare Pages, Netlify) serve the flat `.html` file immediately upon receiving an extensionless clean URL (`GET /r/hanguk`), returning `200 OK` and mounting `#root`.
2. From Observation 1, `generate-video-seo.ts` only writes `path.join(dir, 'index.html')`. Because `public/movie/ep-1` exists as a directory in `public/`, `vite.config.ts`'s `public-wildcard-static-plugin` detects the directory without a trailing slash and issues a `301 Moved Permanently` redirect to `/movie/ep-1/`. This adds an unnecessary redirect roundtrip for Google Video sitemap crawlers.
3. From Observation 2 and 4, `generate-news-seo.ts` also only writes `path.join(dir, 'index.html')`. But unlike video episodes, news comment directories are pruned from `public/` and exist only in `dist/`.
4. Therefore, when a client or Google News crawler requests `GET /r/news/comments/${post.id}` without a trailing slash (the canonical URL declared in `sitemap-news.xml`), the static server:
   - Does not find `dist/r/news/comments/${post.id}.html`.
   - Does not match any directory in `public/`.
   - Falls back to `dist/index.html` (the SPA fallback).
5. Because Milestone 1 decoupled `dist/index.html` into the static landing page (`#landing-root`), visitors requesting news articles receive the landing page instead of the news article.
6. Emitting `${route}.html` alongside `index.html` for all downstream generated routes eliminates both the 301 redirect penalty and the landing page fallback failure.

---

## 3. Caveats

- Top-level routes listed in `scripts/post-build.js`'s `routes` array already generate `.html` files.
- The 40-episode live video and cinema files (`episode_01.mp4` through `episode_40.mp4`) are static video binaries and unaffected by HTML routing.
- News articles are dynamically refreshed from Google News RSS/CSV; writing `${aliasId}.html` directly during each run ensures that any published article has matching `.html` and `index.html`.

---

## 4. Conclusion

**Verdict**: Downstream generators have an architectural omission where only directory `index.html` files are produced.

**Actionable Specification for Worker M1-it3**:
1. **In `scripts/generate-video-seo.ts`**:
   Update `writeHtmlToPublicAndDist(relPath, html)` to write both `path.join(base, relPath, 'index.html')` and `path.join(base, `${relPath}.html`)`.
   - Resolves all 80 episode routes (`dist/movie/ep-1.html` .. `ep-40.html`, `dist/cinema/ep-1.html` .. `ep-40.html`) and hub routes.
2. **In `scripts/generate-news-seo.ts`**:
   Update article comments loop to write both `dist/r/news/comments/${aliasId}/index.html` and `dist/r/news/comments/${aliasId}.html`, as well as `dist/reddit/comments/${aliasId}.html`.
   Update feed dirs loop to write both `index.html` and `.html` (`dist/r/news.html`, `dist/reddit.html`).
3. **In `scripts/post-build.js`**:
   Add `'r/news'` to `routes` array (line 87) for baseline SPA route generation.

---

## 5. Verification Method

To independently verify the downstream route resolution before and after the fix:

```bash
# 1. Run build to regenerate downstream routes:
npm run build

# 2. Check that extensionless .html files are generated:
test -f dist/movie/ep-1.html && echo "PASS: dist/movie/ep-1.html exists"
test -f dist/cinema/ep-40.html && echo "PASS: dist/cinema/ep-40.html exists"
test -f dist/r/news.html && echo "PASS: dist/r/news.html exists"
ls dist/r/news/comments/*.html | head -n 5

# 3. Live HTTP probe on preview server (:3000):
# Downstream news article without trailing slash MUST return #root (NOT landing-root):
curl -s http://localhost:3000/r/news/comments/gnews_0 | grep -o 'id="[^"]*"'
# Expected: id="root"

# Downstream video episode without trailing slash MUST return #root:
curl -s http://localhost:3000/movie/ep-1 | grep -o 'id="[^"]*"'
# Expected: id="root"

# Downstream news feed without trailing slash MUST return #root:
curl -s http://localhost:3000/r/news | grep -o 'id="[^"]*"'
# Expected: id="root"
```

Invalidation Condition:
- If `curl -s http://localhost:3000/r/news/comments/gnews_0` outputs `id="landing-root"`, the downstream fix has failed.
