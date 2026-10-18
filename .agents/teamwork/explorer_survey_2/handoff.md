# Handoff Report — Explorer 2: Sprite Architecture & Coordinates

## 1. Observation

### 1.1 Source Code Observations

#### A. `src/lib/utils.ts` (Lines 137–237)
- **`getCardSpriteAsset(cardId: number): string`** (lines 142–145):
  ```typescript
  export function getCardSpriteAsset(cardId: number): string {
    const id = Number(cardId) || 1;
    return id >= 101 ? '/cards2.png' : '/cards1.png';
  }
  ```
- **`isSpriteSheet(source?: string | null): boolean`** (lines 126–135):
  Checks if `source` contains `'cards1'`, `'card2'`, `'cards2'`, `'card100'`, or `'110card'`.
- **`getCardSpriteCoords(cardId: number, customSource?: string | null): CardSpriteCoords`** (lines 158–221):
  - **Legacy 110 Mode (`customSource` containing `'card100'` or `'110card'`):**
    ```typescript
    const cols = 10;
    const rows = 11;
    const validId = Math.max(1, Math.min(110, id));
    const col = (validId - 1) % cols;
    const row = Math.floor((validId - 1) / cols);
    const source = customSource || '/card100.png';
    return {
      assetUrl: getAssetUrl(source),
      source,
      col,
      row,
      cols,
      rows,
      xPercent: col * (100 / (cols - 1)), // col * (100 / 9)
      yPercent: row * (100 / (rows - 1)), // row * (100 / 10)
    };
    ```
  - **Cards2 Mode (`customSource` containing `'card2'` / `'cards2'` or `id >= 101`):**
    ```typescript
    const cols = 10;
    const rows = 10;
    const offsetIndex = id >= 101 ? (id - 101) % 100 : (id - 1) % 100;
    const col = offsetIndex % 10;
    const row = Math.floor(offsetIndex / 10);
    const source = customSource || '/cards2.png';
    return {
      assetUrl: getAssetUrl(source),
      source,
      col,
      row,
      cols,
      rows,
      xPercent: col * (100 / (cols - 1)), // col * (100 / 9)
      yPercent: row * (100 / (rows - 1)), // row * (100 / 9)
    };
    ```
  - **Default Mode (`/cards1.png`, IDs 1–100):**
    ```typescript
    const cols = 10;
    const rows = 10;
    const validIndex = Math.max(0, Math.min(99, (id - 1) % 100));
    const col = validIndex % cols;
    const row = Math.floor(validIndex / cols);
    const source = customSource || '/cards1.png';
    return {
      assetUrl: getAssetUrl(source),
      source,
      col,
      row,
      cols,
      rows,
      xPercent: col * (100 / (cols - 1)),
      yPercent: row * (100 / (rows - 1)),
    };
    ```
- **`getCardSpriteStyle(cardId: number, customSource?: string | null): CSSProperties`** (lines 228–237):
  ```typescript
  export function getCardSpriteStyle(cardId: number, customSource?: string | null): CSSProperties {
    const coords = getCardSpriteCoords(cardId, customSource);
    return {
      backgroundImage: `url('${coords.assetUrl}')`,
      backgroundSize: `${coords.cols * 100}% ${coords.rows * 100}%`,
      backgroundPosition: `${coords.xPercent}% ${coords.yPercent}%`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated' as const,
    };
  }
  ```

#### B. `src/lib/canvasCardRenderer.ts` (Lines 51–150)
- **Image slicing & drawing:**
  ```typescript
  const sWidth = img.naturalWidth / coords.cols;
  const sHeight = img.naturalHeight / coords.rows;
  const sx = coords.col * sWidth;
  const sy = coords.row * sHeight;
  ...
  ctx.drawImage(img, sx, sy, sWidth, sHeight, drawX, drawY, dWidth, dHeight);
  ```
  - For `cards1.png` (1000x1000): `sWidth = 100`, `sHeight = 100`, `sx = col * 100`, `sy = row * 100`.
  - For `cards2.png` (1000x1000): `sWidth = 100`, `sHeight = 100`, `sx = col * 100`, `sy = row * 100`.
  - For `card100.png` (1135x1315): `sWidth = 113.5`, `sHeight = 119.54545...`, `sx = col * 113.5`, `sy = row * 119.54545...`.
  - For `card100_gemini.png` (1024x1024): `sWidth = 102.4`, `sHeight = 93.090909...`, `sx = col * 102.4`, `sy = row * 93.090909...`.

#### C. `src/components/CardItem.tsx` (Lines 457–477)
- Single image vs sprite sheet branching:
  - If `isSpriteSheet(currentImageSource)` is false (e.g. `/seat/*.png`), rendered as `<img src={currentImageSource} className="h-full w-full object-contain" />`.
  - If `isSpriteSheet(currentImageSource)` is true, rendered as `<div style={{ ...getSpritePosition(visualCardId, currentImageSource), aspectRatio: '19 / 20' }} />`.

---

### 1.2 Physical File System & Image Analysis Observations

| Target Asset | Physical Dimensions | Color Mode & File Format | Byte Size | Layout & Grid Structure |
|---|---|---|---|---|
| `public/seat/*.png` (110 files) | `256 x 296` px | RGBA PNG (107 valid, 3 corrupted) | Min: 14.2 KB, Max: 42.3 KB, Avg: 21.7 KB | 110 standalone portrait files |
| `public/cards1.png` | `1000 x 1000` px | RGBA PNG | 2,024,985 bytes (2.02 MB) | 10 cols x 10 rows (100 cells, IDs 1–100), cells `100x100` px |
| `public/cards2.png` | `1000 x 1000` px | RGBA PNG | 2,799,781 bytes (2.80 MB) | 10 cols x 10 rows. Row 0 = IDs 101–110. Rows 1–9 = 90 legacy cells |
| `public/card100.png` | `1135 x 1315` px | RGBA PNG | 2,103,042 bytes (2.10 MB) | 10 cols x 11 rows (110 cells, IDs 1–110), float cells `113.5 x 119.545` px |
| `public/card100_gemini.png` | `1024 x 1024` px | **RGB JPEG disguised as PNG** | 997,531 bytes (997 KB) | 10 cols x 11 rows (110 cells, IDs 1–110), float cells `102.4 x 93.091` px |
| `public/character_sheet_*.png` (11 files) | `2560 x 296` px | RGBA PNG (8 valid, 3 corrupted) | 170 KB – 377 KB | 10 cols x 1 row (10 cells, IDs 1–10 per faction), cells `256x296` px |

#### Specific File Anomalies Observed Directly:
1. **Header Corruption in 6 Committed PNGs**:
   - `public/seat/Celia.png`
   - `public/seat/Hyperion_Prime.png`
   - `public/seat/Sentinel.png`
   - `public/character_sheet_fire.png`
   - `public/character_sheet_hobbit.png`
   - `public/character_sheet_mecha.png`
   - Verbatim header inspection: `b'\xef\xbf\xbdPNG\r\n\x1a\n\x00\x00\x00\rIH'`
   - Instead of standard PNG magic bytes `b'\x89PNG\r\n\x1a\n'`, byte `0x89` was UTF-8 decoded into `\uFFFD` (`\xef\xbf\xbd`). Standard decoders (PIL `UnidentifiedImageError`, browsers, node-canvas) crash or reject these files.
2. **`card100_gemini.png` is JPEG**:
   - `PIL.Image.open('public/card100_gemini.png').format` reports `'JPEG'`.
   - Mode is `'RGB'`, lacking an alpha channel.
3. **Faction Sheet Naming Aliases**:
   - Dwarf faction (IDs 71–80) -> `character_sheet_hobbit.png`
   - Monster faction (IDs 81–90) -> `character_sheet_beast.png`
   - Robot faction (IDs 91–100) -> `character_sheet_mecha.png`
   - All other 8 factions use exact faction names: `water`, `fire`, `wind`, `earth`, `human`, `undead`, `elf`, `dragon`.
4. **`public/seat/` 1:1 Name Mapping**:
   - Every file in `public/seat/` is named `{title_en.replace(' ', '_')}.png` matching `CARD_DATABASE[id].title_en`. Direct matches: 110 / 110.

---

## 2. Logic Chain

### 2.1 CSS Percentage Coordinate Math
- In `getCardSpriteCoords`, CSS position is given by:
  $$\text{xPercent} = \text{col} \times \frac{100}{\text{cols} - 1}, \quad \text{yPercent} = \text{row} \times \frac{100}{\text{rows} - 1}$$
- In `getCardSpriteStyle`, background size is:
  $$\text{backgroundSize} = (\text{cols} \times 100)\% \times (\text{rows} \times 100)\%$$
- CSS specification for background-position percentage:
  $$\text{offset}_{px} = (W_{container} - W_{image}) \times \frac{\text{xPercent}}{100}$$
  Since $W_{image} = \text{cols} \times W_{container}$, $(W_{container} - W_{image}) = -(\text{cols} - 1) \times W_{container}$.
  Multiplying by $\frac{\text{col} \times 100 / (\text{cols} - 1)}{100}$ yields exactly $-\text{col} \times W_{container}$.
- Therefore, CSS background slicing aligns accurately to integer cell boundaries provided the underlying sheet cells have uniform dimensions and aspect ratios.

### 2.2 Sub-Pixel Interpolation & Edge Bleeding Mechanics
- In `canvasCardRenderer.ts`, `ctx.drawImage` slices:
  $$s_x = \text{col} \times \frac{W_{sheet}}{\text{cols}}, \quad s_y = \text{row} \times \frac{H_{sheet}}{\text{rows}}, \quad s_w = \frac{W_{sheet}}{\text{cols}}, \quad s_h = \frac{H_{sheet}}{\text{rows}}$$
- For `cards1.png` and `cards2.png` ($1000 \times 1000$), $s_w = 100$, $s_h = 100$, producing pure integer source rectangles.
- For `card100.png` ($1135 \times 1315$), $s_w = 113.5$, $s_h = 119.54545...$. Floating point source coordinates require GPU/canvas bilinear interpolation. If a character illustration touches the cell boundary (0px margin), adjacent character pixels bleed into the rendered sprite.
- In `cards1.png` and `card100.png`, empirical pixel analysis revealed an intentional 4–6 px transparent boundary zone around each cell, preventing sub-pixel edge bleeding.

### 2.3 Aspect Ratio Harmony Across Targets
- `public/seat/*.png`: $256 \times 296 \implies \text{aspect ratio} \approx 0.86486$.
- `CardItem.tsx` CSS container: `aspectRatio: '19 / 20' = 0.95`.
- `card100.png`: cell is $113.5 \times 119.545 \implies \text{aspect ratio} \approx 0.94943$ (identical to $19 / 20$).
- `cards1.png`: cell is $100 \times 100 \implies \text{aspect ratio} = 1.0$.
- In `character_sheet_*.png`: cell is $256 \times 296 \implies$ exact $1:1$ copy of `public/seat/*.png`.

---

## 3. Caveats
1. **Unused Rows in `cards2.png`**: Rows 1–9 of `cards2.png` contain 90 legacy cells from early prototypes. While `CARD_DATABASE` only defines IDs 1–110 (using Row 0 for IDs 101–110), downstream workers should preserve existing rows 1–9 or cleanly format them to avoid breaking any undocumented test references.
2. **PIL Quantization Method Restriction**: Pillow `Image.quantize` for RGBA images rejects `MEDIANCUT` (raises `ValueError`) and requires `method=Image.Quantize.FASTOCTREE` (method=2). Workers must use `FASTOCTREE` to achieve the $\le 800\text{ KB}$ budget.

---

## 4. Conclusion & Mathematical Specification

### 4.1 Master Coordinate & Cell Dimensions Matrix

| Target Asset | Total Canvas Size | Cols $\times$ Rows | Card IDs Assigned | Cell Dimension ($W \times H$) | Safe Inner Drawing Box | Slicing Formula |
|---|---|---|---|---|---|---|
| **`public/seat/*.png`** | $256 \times 296$ | Standalone (110 files) | 1 per file (1..110) | $256 \times 296$ px | $240 \times 280$ px | Full file |
| **`public/cards1.png`** | $1000 \times 1000$ | $10 \times 10$ | IDs 1–100 | $100 \times 100$ px | $86 \times 100$ px (or $80 \times 92$ px) | $\begin{aligned} c &= (id-1)\%10 \\ r &= \lfloor(id-1)/10\rfloor \\ x &= c \times 100 \\ y &= r \times 100 \end{aligned}$ |
| **`public/cards2.png`** | $1000 \times 1000$ | $10 \times 10$ | Row 0: IDs 101–110<br>Rows 1–9: Legacy | $100 \times 100$ px | $86 \times 100$ px (or $80 \times 92$ px) | $\begin{aligned} c &= (id-101)\%10 \\ r &= 0 \\ x &= c \times 100 \\ y &= 0 \end{aligned}$ |
| **`public/card100.png`** | $1135 \times 1315$ | $10 \times 11$ | IDs 1–110 | Float: $113.5 \times 119.545$<br>Int box: $x \in [\text{round}(c \times 113.5), \text{round}((c+1) \times 113.5)]$ | Centered: $\sim 94 \times 104$ px | $\begin{aligned} c &= (id-1)\%10 \\ r &= \lfloor(id-1)/10\rfloor \\ x_0 &= \text{round}(c \times 113.5) \\ y_0 &= \text{round}(r \times 119.545) \end{aligned}$ |
| **`public/card100_gemini.png`** | $1024 \times 1024$ | $10 \times 11$ | IDs 1–110 | Float: $102.4 \times 93.091$<br>Int box: $x \in [\text{round}(c \times 102.4), \text{round}((c+1) \times 102.4)]$ | Centered: $\sim 78 \times 90$ px | $\begin{aligned} c &= (id-1)\%10 \\ r &= \lfloor(id-1)/10\rfloor \\ x_0 &= \text{round}(c \times 102.4) \\ y_0 &= \text{round}(r \times 93.091) \end{aligned}$ |
| **`public/character_sheet_*.png`** | $2560 \times 296$ | $10 \times 1$ | 10 per faction (IDs $10f+1$ .. $10f+10$) | $256 \times 296$ px | $256 \times 296$ px | $\begin{aligned} c &= (id-1)\%10 \\ r &= 0 \\ x &= c \times 256 \\ y &= 0 \end{aligned}$ |

---

### 4.2 Exact Mathematical Transformations for Compositing

Given an individual remastered portrait $P_{id}$ of size $256 \times 296$ (RGBA):

#### 1. Faction Sheets (`character_sheet_{faction}.png`):
- Exact $1:1$ horizontal placement:
  $$x = ((id - 1) \pmod{10}) \times 256, \quad y = 0$$
  $$\text{Sheet.paste}(P_{id}, (x, y))$$

#### 2. Master Sheets `cards1.png` (IDs 1–100) & `cards2.png` (IDs 101–110):
- Calculate grid indices:
  $$\text{For } cards1: c = (id - 1) \pmod{10}, \quad r = \lfloor(id - 1) / 10\rfloor$$
  $$\text{For } cards2: c = (id - 101) \pmod{10}, \quad r = 0$$
- Scaling portrait to $100 \times 100$ cell with aspect ratio preservation and 4px safety margins:
  $$H_{target} = 92\text{ px}, \quad W_{target} = \text{round}\left(256 \times \frac{92}{296}\right) = 80\text{ px}$$
  $$\Delta x = \frac{100 - W_{target}}{2} = 10\text{ px}, \quad \Delta y = \frac{100 - H_{target}}{2} = 4\text{ px}$$
  $$x_{dest} = c \times 100 + \Delta x, \quad y_{dest} = r \times 100 + \Delta y$$
  $$\text{Sheet.paste}(P_{id}.\text{resize}((80, 92), \text{LANCZOS}), (x_{dest}, y_{dest}), \text{mask})$$

#### 3. Legacy Sheet `card100.png` ($1135 \times 1315$, IDs 1–110):
- For $id \in [1, 110]$:
  $$c = (id - 1) \pmod{10}, \quad r = \lfloor(id - 1) / 10\rfloor$$
  $$x_0 = \text{int}(\text{round}(c \times 113.5)), \quad x_1 = \text{int}(\text{round}((c + 1) \times 113.5))$$
  $$y_0 = \text{int}(\text{round}(r \times (1315 / 11))), \quad y_1 = \text{int}(\text{round}((r + 1) \times (1315 / 11)))$$
  $$W_{cell} = x_1 - x_0, \quad H_{cell} = y_1 - y_0$$
- Fit $256 \times 296$ into $W_{cell} \times H_{cell}$ with 8px margin:
  $$H_{target} = H_{cell} - 16 \approx 103\text{ px}, \quad W_{target} = \text{round}\left(256 \times \frac{H_{target}}{296}\right) \approx 89\text{ px}$$
  $$\Delta x = \frac{W_{cell} - W_{target}}{2}, \quad \Delta y = \frac{H_{cell} - H_{target}}{2}$$
  $$x_{dest} = x_0 + \Delta x, \quad y_{dest} = y_0 + \Delta y$$

#### 4. Legacy Sheet `card100_gemini.png` ($1024 \times 1024$, IDs 1–110):
- Convert from JPEG to RGBA PNG.
  $$x_0 = \text{int}(\text{round}(c \times 102.4)), \quad y_0 = \text{int}(\text{round}(r \times (1024 / 11)))$$
  $$H_{target} = 80\text{ px}, \quad W_{target} = \text{round}\left(256 \times \frac{80}{296}\right) = 69\text{ px}$$
  $$\Delta x = \frac{(x_1 - x_0) - W_{target}}{2}, \quad \Delta y = \frac{(y_1 - y_0) - H_{target}}{2}$$

---

### 4.3 Python Composite & Quantization Reference Script
Downstream workers can execute this exact composite logic:
```python
from PIL import Image

def quantize_and_save(img: Image.Image, output_path: str, max_colors: int = 256):
    """Safely quantizes RGBA image and saves under file size budget."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    # Use FASTOCTREE for RGBA images to avoid Pillow ValueError
    quantized = img.quantize(colors=max_colors, method=Image.Quantize.FASTOCTREE)
    quantized.save(output_path, format='PNG', optimize=True)
```

---

## 5. Verification Method

### 5.1 Verification Commands
1. **Header Integrity & Format Check**:
   ```bash
   python3 -c "
   from PIL import Image
   import glob
   for p in glob.glob('public/seat/*.png') + glob.glob('public/character_sheet_*.png') + ['public/cards1.png', 'public/cards2.png', 'public/card100.png', 'public/card100_gemini.png']:
       with Image.open(p) as img:
           assert img.format == 'PNG', f'{p} is {img.format}, not PNG'
           assert img.mode in ('RGBA', 'P'), f'{p} mode is {img.mode}'
   print('All images verified valid PNG with alpha!')
   "
   ```
2. **Dimension & Budget Verification**:
   ```bash
   python3 -c "
   import os, glob
   from PIL import Image

   # Check Seat: 256x296, <= 35KB
   for p in glob.glob('public/seat/*.png'):
       assert Image.open(p).size == (256, 296), f'{p} bad dimensions'
       assert os.path.getsize(p) <= 35840, f'{p} exceeds 35KB: {os.path.getsize(p)}'

   # Check Sheets: <= 800KB
   for p in ['public/cards1.png', 'public/cards2.png', 'public/card100.png', 'public/card100_gemini.png']:
       assert os.path.getsize(p) <= 819200, f'{p} exceeds 800KB: {os.path.getsize(p)}'

   # Check Faction Sheets: 2560x296, <= 300KB
   for p in glob.glob('public/character_sheet_*.png'):
       assert Image.open(p).size == (2560, 296), f'{p} bad dimensions'
       assert os.path.getsize(p) <= 307200, f'{p} exceeds 300KB: {os.path.getsize(p)}'

   print('All dimensions and size budgets verified 100% compliant!')
   "
   ```

### 5.2 Invalidation Conditions
- Any asset in `public/seat/*.png` having dimensions other than `256 x 296` or size `> 35 KB`.
- `card100_gemini.png` remaining as JPEG without alpha.
- Any sprite sheet cell exhibiting coordinate clipping, drift, or adjacent-pixel ghosting in `canvasCardRenderer.ts` or `CardItem.tsx`.
