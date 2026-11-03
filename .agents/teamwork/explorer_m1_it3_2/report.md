# Milestone 1 Iteration 3: Downstream Generators Investigation Report
**Target**: Downstream Generators (`scripts/generate-news-seo.ts` & `scripts/generate-video-seo.ts`)
**Author**: Explorer 2 (`explorer_m1_it3_2`)
**Date**: 2026-11-02T18:00:00Z
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_2/`

---

## 1. Executive Summary

1. **Downstream Route Generation Defect**:
   Both `scripts/generate-news-seo.ts` and `scripts/generate-video-seo.ts` currently **only write directory `index.html` files** (e.g. `dist/movie/ep-1/index.html`, `dist/r/news/comments/gnews_0/index.html`, `dist/r/news/index.html`) and **completely omit generating extensionless `.html` files** (e.g. `dist/movie/ep-1.html`, `dist/r/news/comments/gnews_0.html`, `dist/r/news.html`).
2. **Why `/r/hanguk` and `/r/hanguk/comments/post_vibecoding_master` Work**:
   These routes are handled by `scripts/post-build.js` (lines 79–100, 277–307). `scripts/post-build.js` was updated to write **both** `dist/[route]/index.html` and `dist/[route].html`. As a result, static servers cleanly match `dist/r/hanguk.html` and `dist/r/hanguk/comments/post_vibecoding_master.html` for clean URLs without trailing slashes, returning `200 OK` with `#root`.
3. **Severe Downstream Landing Page Fallback (The Smoking Gun)**:
   - For `generate-video-seo.ts`, requests to `/movie/ep-1` trigger an **HTTP 301 Redirect** to `/movie/ep-1/` because `public/movie/ep-1` exists as a directory in `public/` (caught by `vite.config.ts`'s `public-wildcard-static-plugin`).
   - For `generate-news-seo.ts`, however, `public/r/news/comments` was intentionally pruned to reduce repo bloat (lines 658–665), so news comment directories **only exist in `dist/`**.
   - When a crawler or user visits `GET /r/news/comments/gnews_1793608080000_0` (the exact URL published in `sitemap-news.xml`), the static server cannot find `dist/r/news/comments/gnews_1793608080000_0.html` and `public-wildcard-static-plugin` has no matching directory in `public/`.
   - **Empirical Failure**: The server falls back to single-page application fallback `dist/index.html` (Content-Length 44,977 bytes, mounting `id="landing-root"`). Googlebot, Google News Discover crawlers, and users clicking extensionless article links receive the **landing page instead of the news article**!
4. **Remediation Required**:
   Both downstream generators must be updated so their write functions emit **both** directory `index.html` and flat `${route}.html`. In addition, `'r/news'` should be included in `scripts/post-build.js`'s `routes` list.

---

## 2. Forensic Investigation of `scripts/generate-video-seo.ts`

### 2.1 Route Architecture & What is Generated
`scripts/generate-video-seo.ts` generates SEO/GEO/AEO static pages for:
- 3 Video Hubs:
  - `/movie` (Animation 40-episode series hub)
  - `/animation` (Alias hub)
  - `/cinema` (Live-Action Movie 40-episode series hub)
- 80 Individual Episode Pages:
  - `/movie/ep-1` through `/movie/ep-40` (40 animation episodes)
  - `/cinema/ep-1` through `/cinema/ep-40` (40 cinema episodes)

### 2.2 Inspection of Write Function
Lines 700–711 in `scripts/generate-video-seo.ts`:
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
And its invocation at lines 734–745:
```typescript
writeHtmlToPublicAndDist('movie', animeHubHtml);
writeHtmlToPublicAndDist('animation', animeHubHtml);
writeHtmlToPublicAndDist('cinema', movieHubHtml);

for (const ep of episodes) {
  const animeEpHtml = buildEpisodeHtml(baseHtml, ep, 'anime', episodes);
  const movieEpHtml = buildEpisodeHtml(baseHtml, ep, 'movie', episodes);

  writeHtmlToPublicAndDist(path.join('movie', `ep-${ep.episodeNumber}`), animeEpHtml);
  writeHtmlToPublicAndDist(path.join('cinema', `ep-${ep.episodeNumber}`), movieEpHtml);
}
```

### 2.3 Analysis:
1. `writeHtmlToPublicAndDist` **only writes `path.join(dir, 'index.html')`**.
2. It **never writes `dist/movie/ep-1.html`** or `dist/cinema/ep-1.html`.
3. In `dist/sitemap-video.xml` (line 45), Google Video Sitemap registers:
   `<loc>https://snshero.com/movie/ep-1</loc>` (without trailing slash).
4. When `GET /movie/ep-1` is requested:
   - Command: `curl -I http://localhost:3000/movie/ep-1`
   - Response: `HTTP/1.1 301 Moved Permanently`, `Location: /movie/ep-1/`
   - While redirected clients eventually load `/movie/ep-1/index.html`, search engine crawlers suffer redirect latency, and static CDNs without directory redirection fall back to `dist/index.html`.

---

## 3. Forensic Investigation of `scripts/generate-news-seo.ts`

### 3.1 Route Architecture & What is Generated
`scripts/generate-news-seo.ts` generates:
- News Feed Hubs:
  - `/reddit`
  - `/r/news`
- Real-time News Comment Articles:
  - Up to 120 latest articles with 2 alias formats per article:
    - `/r/news/comments/${post.id}` (e.g. `/r/news/comments/gnews_1793608080000_0`)
    - `/r/news/comments/gnews_${idx}` (e.g. `/r/news/comments/gnews_0`)
    - `/reddit/comments/${post.id}`
    - `/reddit/comments/gnews_${idx}`

### 3.2 Inspection of Write Logic
Lines 681–697 in `scripts/generate-news-seo.ts`:
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
And lines 704–720 for feed hubs:
```typescript
const feedDirs = [
  path.join(publicDir, 'reddit'),
  path.join(publicDir, 'r', 'news'),
];
if (fs.existsSync(distDir)) {
  feedDirs.push(
    path.join(distDir, 'reddit'),
    path.join(distDir, 'r', 'news')
  );
}
for (const dir of feedDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'index.html'), redditIndexHtml, 'utf8');
}
```

### 3.3 The Pruning Factor & Severe Live Failure:
In lines 658–665:
```typescript
for (const staleCommentsDir of [
  path.join(publicDir, 'r', 'news', 'comments'),
  path.join(publicDir, 'reddit', 'comments'),
]) {
  if (fs.existsSync(staleCommentsDir)) {
    fs.rmSync(staleCommentsDir, { recursive: true, force: true });
  }
}
```
Because `public/r/news/comments` was cleared, news comments exist **only in `dist/`**, not in `public/`.
In `vite.config.ts`, `public-wildcard-static-plugin` only checks `publicDir`. It does not match news comments in `dist/`.

### 3.4 Empirical Reproduction on Running Server (Port 3000):
```bash
# 1. Trailing slash request:
curl -s http://localhost:3000/r/news/comments/gnews_0/ | grep -o 'id="[^"]*"'
# Output: id="root" (PASS: serves news article HTML)

# 2. Extensionless clean URL request (as published in sitemap-news.xml!):
curl -s http://localhost:3000/r/news/comments/gnews_0 | grep -o 'id="[^"]*"'
# Output: id="landing-root" (CRITICAL DEFECT: serves the landing page!)

# 3. Exact URL from sitemap-news.xml line 5:
curl -s http://localhost:3000/r/news/comments/gnews_1793608080000_0 | grep -o 'id="[^"]*"'
# Output: id="landing-root" (CRITICAL DEFECT)
```
Because `dist/r/news/comments/gnews_0.html` does not exist, the preview server falls back to `dist/index.html` (the `#landing-root` static landing page, 44,977 bytes).

---

## 4. How Static Servers Handle Routes (Comparison Matrix)

| Route Type | Example URL | Files on Disk | Static Server Handling | Resulting Response |
|---|---|---|---|---|
| **Post-Build Nested Route** | `/r/hanguk` | `dist/r/hanguk/index.html`<br>`dist/r/hanguk.html` | Directly matches `dist/r/hanguk.html` | **200 OK** (`#root`, SPA) |
| **Post-Build Nested Route** | `/r/hanguk/comments/post_vibecoding_master` | `.../index.html`<br>`.../post_vibecoding_master.html` | Directly matches `.../post_vibecoding_master.html` | **200 OK** (`#root`, SPA) |
| **Post-Build Nested Route** | `/wiki/card` | `dist/wiki/card/index.html`<br>`dist/wiki/card.html` | Directly matches `dist/wiki/card.html` | **200 OK** (`#root`, SPA) |
| **Downstream Video Episode** | `/movie/ep-1` | `dist/movie/ep-1/index.html`<br>*(no `ep-1.html`)* | Matches `public/movie/ep-1/` dir | **301 Redirect** -> `/movie/ep-1/` |
| **Downstream Video Episode (trailing)** | `/movie/ep-1/` | `dist/movie/ep-1/index.html` | Matches directory `index.html` | **200 OK** (`#root`, Video SEO) |
| **Downstream News Feed** | `/r/news` | `dist/r/news/index.html`<br>*(no `r/news.html`)* | Matches `public/r/news/` dir | **301 Redirect** -> `/r/news/` |
| **Downstream News Article** | `/r/news/comments/gnews_0` | `dist/.../gnews_0/index.html`<br>*(no `gnews_0.html`, pruned from public)* | No flat file, no public dir match -> Falls back to `dist/index.html` | **200 OK with `landing-root`** ❌ (LANDING BUG) |
| **Downstream News Article (trailing)** | `/r/news/comments/gnews_0/` | `dist/.../gnews_0/index.html` | Matches directory `index.html` | **200 OK** (`#root`, News SEO) |

---

## 5. Complete Inventory of Missing `.html` Files for Downstream Routes

### 5.1 `scripts/generate-video-seo.ts` Missing Files (83 files):
1. **80 Episode `.html` Files**:
   - `dist/movie/ep-1.html` through `dist/movie/ep-40.html` (40 files)
   - `dist/cinema/ep-1.html` through `dist/cinema/ep-40.html` (40 files)
2. **3 Hub `.html` Files** (ensured with Video SEO content):
   - `dist/movie.html`
   - `dist/animation.html`
   - `dist/cinema.html`

### 5.2 `scripts/generate-news-seo.ts` Missing Files:
1. **Feed Hub `.html` File**:
   - `dist/r/news.html` (`dist/reddit.html` is generated by `post-build.js`, but `r/news` is missing from `post-build.js`'s routes list).
2. **Comment Article `.html` Files**:
   - For all active posts in `recentPostsForStatic` (up to 120 posts) and their aliases:
     - `dist/r/news/comments/${post.id}.html`
     - `dist/r/news/comments/gnews_${idx}.html`
     - `dist/reddit/comments/${post.id}.html`
     - `dist/reddit/comments/gnews_${idx}.html`

---

## 6. Concrete Specification & Code for Worker M1-it3

### 6.1 Changes to `scripts/generate-video-seo.ts`
Replace `writeHtmlToPublicAndDist` (lines 700–711):

```typescript
// BEFORE:
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

// AFTER:
function writeHtmlToPublicAndDist(relPath: string, html: string) {
  const baseDirs = [publicDir];
  if (fs.existsSync(distDir)) {
    baseDirs.push(distDir);
  }
  for (const base of baseDirs) {
    // 1. Directory index: e.g. dist/movie/ep-1/index.html
    const dir = path.join(base, relPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');

    // 2. Extensionless clean URL flat file: e.g. dist/movie/ep-1.html
    const flatFile = path.join(base, `${relPath}.html`);
    const flatDir = path.dirname(flatFile);
    if (!fs.existsSync(flatDir)) {
      fs.mkdirSync(flatDir, { recursive: true });
    }
    fs.writeFileSync(flatFile, html, 'utf8');
  }
}
```

### 6.2 Changes to `scripts/generate-news-seo.ts`

#### A. In Article Comments Generation (around line 681):
```typescript
// BEFORE:
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

// AFTER:
for (const aliasId of idAliases) {
  const targets: { dir: string; flatFile: string }[] = [];
  if (fs.existsSync(distDir)) {
    targets.push(
      {
        dir: path.join(distDir, 'r', 'news', 'comments', aliasId),
        flatFile: path.join(distDir, 'r', 'news', 'comments', `${aliasId}.html`),
      },
      {
        dir: path.join(distDir, 'reddit', 'comments', aliasId),
        flatFile: path.join(distDir, 'reddit', 'comments', `${aliasId}.html`),
      }
    );
  }
  for (const item of targets) {
    // 1. Directory index
    if (!fs.existsSync(item.dir)) {
      fs.mkdirSync(item.dir, { recursive: true });
    }
    fs.writeFileSync(path.join(item.dir, 'index.html'), articleHtml, 'utf8');

    // 2. Extensionless clean URL flat file
    const flatDir = path.dirname(item.flatFile);
    if (!fs.existsSync(flatDir)) {
      fs.mkdirSync(flatDir, { recursive: true });
    }
    fs.writeFileSync(item.flatFile, articleHtml, 'utf8');
  }
}
```

#### B. In Feed Hub Generation (around line 704):
```typescript
// BEFORE:
const feedDirs = [
  path.join(publicDir, 'reddit'),
  path.join(publicDir, 'r', 'news'),
];
if (fs.existsSync(distDir)) {
  feedDirs.push(
    path.join(distDir, 'reddit'),
    path.join(distDir, 'r', 'news')
  );
}
for (const dir of feedDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'index.html'), redditIndexHtml, 'utf8');
}

// AFTER:
const feedRoutes = [
  { dir: path.join(publicDir, 'reddit'), flat: path.join(publicDir, 'reddit.html') },
  { dir: path.join(publicDir, 'r', 'news'), flat: path.join(publicDir, 'r', 'news.html') },
];
if (fs.existsSync(distDir)) {
  feedRoutes.push(
    { dir: path.join(distDir, 'reddit'), flat: path.join(distDir, 'reddit.html') },
    { dir: path.join(distDir, 'r', 'news'), flat: path.join(distDir, 'r', 'news.html') }
  );
}
for (const item of feedRoutes) {
  if (!fs.existsSync(item.dir)) {
    fs.mkdirSync(item.dir, { recursive: true });
  }
  fs.writeFileSync(path.join(item.dir, 'index.html'), redditIndexHtml, 'utf8');

  const flatDir = path.dirname(item.flat);
  if (!fs.existsSync(flatDir)) {
    fs.mkdirSync(flatDir, { recursive: true });
  }
  fs.writeFileSync(item.flat, redditIndexHtml, 'utf8');
}
```

### 6.3 Supporting Change in `scripts/post-build.js`
In line 87 of `scripts/post-build.js`, add `'r/news'` to the `routes` list:
```javascript
  // Reddit Subreddits
  'r', 'r/hanguk', 'r/technology', 'r/gaming', 'r/popular', 'r/all', 'r/home', 'r/AskReddit', 'r/memes', 'r/news',
```
This ensures baseline SPA route generation for `/r/news` and `dist/r/news.html` before `generate-news-seo.ts` injects the live Google News articles.

---

## 7. Verification Method

Once Worker M1-it3 implements the changes and runs `npm run build`:

```bash
# 1. Verify existence of extensionless .html files for video episodes:
test -f dist/movie/ep-1.html && echo "movie/ep-1.html OK"
test -f dist/cinema/ep-40.html && echo "cinema/ep-40.html OK"

# 2. Verify existence of extensionless .html files for news:
test -f dist/r/news.html && echo "r/news.html OK"
ls dist/r/news/comments/*.html | head -n 5

# 3. Direct curl probes on Preview Server (:3000):
# A. Video episode without trailing slash must return 200 OK directly (no 301 needed):
curl -s http://localhost:3000/movie/ep-1 | grep -o 'id="[^"]*"'
# Must return: id="root"

# B. News article without trailing slash must return id="root" (NOT landing-root!):
curl -s http://localhost:3000/r/news/comments/gnews_0 | grep -o 'id="[^"]*"'
# Must return: id="root"

# C. News feed without trailing slash:
curl -s http://localhost:3000/r/news | grep -o 'id="[^"]*"'
# Must return: id="root"
```
