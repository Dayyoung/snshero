/**
 * src/landing/services/qrCodeSvg.ts
 *
 * Pure TypeScript / Zero-React ISO/IEC 18004 QR Code SVG Generator
 * & Cryptocurrency Deposit Address / Network Resolver for SNSHero (#shop & #mall).
 *
 * Based on Project Nayuki QR Code generator library (MIT License).
 */

export interface CryptoCoinOption {
  ccy: string;
  name: string;
  chains: string[];
  icon: string;
}

export interface CryptoDepositDetails {
  ccy: string;
  name: string;
  chain: string;
  address: string;
  amount: string;
  priceUsd: number;
  qrSvg: string;
}

export const CRYPTO_COINS_CATALOG: CryptoCoinOption[] = [
  {
    ccy: 'USDT',
    name: 'Tether USD',
    chains: ['USDT-TRC20', 'USDT-ERC20', 'USDT-Polygon', 'USDT-Arbitrum One', 'USDT-Solana'],
    icon: '💵',
  },
  {
    ccy: 'TRX',
    name: 'TRON',
    chains: ['TRX-TRC20'],
    icon: '🔴',
  },
  {
    ccy: 'BTC',
    name: 'Bitcoin',
    chains: ['BTC-Bitcoin', 'BTC-Lightning'],
    icon: '₿',
  },
  {
    ccy: 'ETH',
    name: 'Ethereum',
    chains: ['ETH-ERC20', 'ETH-Arbitrum One', 'ETH-Optimism', 'ETH-Base'],
    icon: 'Ξ',
  },
  {
    ccy: 'SOL',
    name: 'Solana',
    chains: ['SOL-Solana'],
    icon: '◎',
  },
  {
    ccy: 'USDC',
    name: 'USD Coin',
    chains: ['USDC-ERC20', 'USDC-Solana', 'USDC-Polygon'],
    icon: '💲',
  },
  {
    ccy: 'DOGE',
    name: 'Dogecoin',
    chains: ['DOGE-Dogecoin'],
    icon: 'Ð',
  },
  {
    ccy: 'XRP',
    name: 'Ripple',
    chains: ['XRP-ERC20', 'XRP-Ripple'],
    icon: '✕',
  },
];

export const CRYPTO_QUICK_CHIPS: string[] = ['USDT', 'BTC', 'ETH', 'SOL', 'USDC'];

const CRYPTO_RATES_PER_USD: Record<string, number> = {
  USDT: 1.0,
  USDC: 1.0,
  TRX: 6.25,
  BTC: 0.000015,
  ETH: 0.00029,
  SOL: 0.0068,
  DOGE: 6.25,
  XRP: 1.65,
};

export function resolveCryptoAddressForChain(ccy: string, chain: string): string {
  const ccyUpper = (ccy || 'USDT').toUpperCase();
  const chainName = chain || `${ccyUpper}-TRC20`;

  if (chainName.includes('TRC20') || ccyUpper === 'TRX') {
    return 'TCYytM1g3xjPo9KR7Sky4ibpZgB9MxL7PH';
  }
  if (chainName.includes('BTC') || chainName.includes('Bitcoin') || chainName.includes('Lightning')) {
    return 'bc1qa0x4y2nrwgd0mcpuke33g08umjs8t3fmv2qpn2';
  }
  if (chainName.includes('DOGE')) {
    return 'DCgwCiMd66t18YXAKRJtoUNpbt9sn5mR6m';
  }
  if (chainName.includes('Solana') || chainName.includes('SOL')) {
    return '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  }
  // EVM / ERC20 / Polygon / Arbitrum / Optimism / Base / XRP
  return '0x59448a8bb4d0944568b7344519f59e2960b8d8c6';
}

export function resolveCryptoDepositDetails(
  ccy: string,
  chain: string | undefined,
  priceUsd: number
): CryptoDepositDetails {
  const coin = CRYPTO_COINS_CATALOG.find((c) => c.ccy === ccy) || CRYPTO_COINS_CATALOG[0];
  const resolvedChain = chain || coin.chains[0] || `${coin.ccy}-TRC20`;
  const address = resolveCryptoAddressForChain(coin.ccy, resolvedChain);
  const ccyUpper = coin.ccy.toUpperCase();
  const rate = CRYPTO_RATES_PER_USD[ccyUpper] ?? 1.0;
  const isHighPrecision = ccyUpper === 'BTC' || ccyUpper === 'ETH';
  const amount = (Math.max(0.5, priceUsd) * rate).toFixed(isHighPrecision ? 6 : 2);
  const qrSvg = renderQrCodeSvg(address, 168);

  return {
    ccy: coin.ccy,
    name: coin.name,
    chain: resolvedChain,
    address,
    amount,
    priceUsd,
    qrSvg,
  };
}

// ============================================================================
// Pure TypeScript QR Code Matrix Encoder (Project Nayuki MIT)
// ============================================================================

const qrcodegen: any = {};
((qrcodegen2: any) => {
  const _QrCode = class _QrCode {
    version: number;
    errorCorrectionLevel: any;
    modules: boolean[][];
    isFunction: boolean[][];
    size: number;
    mask: number;

    static MIN_VERSION = 1;
    static MAX_VERSION = 40;
    static PENALTY_N1 = 3;
    static PENALTY_N2 = 3;
    static PENALTY_N3 = 40;
    static PENALTY_N4 = 10;
    static ECC_CODEWORDS_PER_BLOCK = [
      [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
      [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
      [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
      [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    ];
    static NUM_ERROR_CORRECTION_BLOCKS = [
      [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
      [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
      [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
      [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
    ];
    static Ecc: any;

    constructor(version: number, errorCorrectionLevel: any, dataCodewords: number[], msk: number) {
      this.version = version;
      this.errorCorrectionLevel = errorCorrectionLevel;
      this.modules = [];
      this.isFunction = [];
      this.size = version * 4 + 17;
      const row: boolean[] = [];
      for (let i = 0; i < this.size; i++) row.push(false);
      for (let i = 0; i < this.size; i++) {
        this.modules.push(row.slice());
        this.isFunction.push(row.slice());
      }
      this.drawFunctionPatterns();
      const allCodewords = this.addEccAndInterleave(dataCodewords);
      this.drawCodewords(allCodewords);
      if (msk === -1) {
        let minPenalty = 1e9;
        for (let i = 0; i < 8; i++) {
          this.applyMask(i);
          this.drawFormatBits(i);
          const penalty = this.getPenaltyScore();
          if (penalty < minPenalty) {
            msk = i;
            minPenalty = penalty;
          }
          this.applyMask(i);
        }
      }
      this.mask = msk;
      this.applyMask(msk);
      this.drawFormatBits(msk);
      this.isFunction = [];
    }

    static encodeText(text: string, ecl: any) {
      const segs = qrcodegen2.QrSegment.makeSegments(text);
      return _QrCode.encodeSegments(segs, ecl);
    }

    static encodeSegments(
      segs: any[],
      ecl: any,
      minVersion = 1,
      maxVersion = 40,
      mask = -1,
      boostEcl = true
    ) {
      let version: number;
      let dataUsedBits: number;
      for (version = minVersion; ; version++) {
        const dataCapacityBits2 = _QrCode.getNumDataCodewords(version, ecl) * 8;
        const usedBits = qrcodegen2.QrSegment.getTotalBits(segs, version);
        if (usedBits <= dataCapacityBits2) {
          dataUsedBits = usedBits;
          break;
        }
        if (version >= maxVersion) throw new RangeError('Data too long');
      }
      for (const newEcl of [_QrCode.Ecc.MEDIUM, _QrCode.Ecc.QUARTILE, _QrCode.Ecc.HIGH]) {
        if (boostEcl && dataUsedBits <= _QrCode.getNumDataCodewords(version, newEcl) * 8) {
          ecl = newEcl;
        }
      }
      const bb: number[] = [];
      for (const seg of segs) {
        appendBits(seg.mode.modeBits, 4, bb);
        appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);
        for (const b of seg.getData()) bb.push(b);
      }
      const dataCapacityBits = _QrCode.getNumDataCodewords(version, ecl) * 8;
      appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
      appendBits(0, (8 - (bb.length % 8)) % 8, bb);
      for (let padByte = 236; bb.length < dataCapacityBits; padByte ^= 236 ^ 17) {
        appendBits(padByte, 8, bb);
      }
      const dataCodewords: number[] = [];
      while (dataCodewords.length * 8 < bb.length) dataCodewords.push(0);
      bb.forEach((b, i) => (dataCodewords[i >>> 3] |= b << (7 - (i & 7))));
      return new _QrCode(version, ecl, dataCodewords, mask);
    }

    getModules(): boolean[][] {
      return this.modules;
    }

    drawFunctionPatterns() {
      for (let i = 0; i < this.size; i++) {
        this.setFunctionModule(6, i, i % 2 === 0);
        this.setFunctionModule(i, 6, i % 2 === 0);
      }
      this.drawFinderPattern(3, 3);
      this.drawFinderPattern(this.size - 4, 3);
      this.drawFinderPattern(3, this.size - 4);
      const alignPatPos = this.getAlignmentPatternPositions();
      const numAlign = alignPatPos.length;
      for (let i = 0; i < numAlign; i++) {
        for (let j = 0; j < numAlign; j++) {
          if (!((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0))) {
            this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
          }
        }
      }
      this.drawFormatBits(0);
      this.drawVersion();
    }

    drawFormatBits(mask: number) {
      const data = (this.errorCorrectionLevel.formatBits << 3) | mask;
      let rem = data;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 1335);
      const bits = ((data << 10) | rem) ^ 21522;
      for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
      this.setFunctionModule(8, 7, getBit(bits, 6));
      this.setFunctionModule(8, 8, getBit(bits, 7));
      this.setFunctionModule(7, 8, getBit(bits, 8));
      for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));
      for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
      for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
      this.setFunctionModule(8, this.size - 8, true);
    }

    drawVersion() {
      if (this.version < 7) return;
      let rem = this.version;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 7973);
      const bits = (this.version << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const color = getBit(bits, i);
        const a = this.size - 11 + (i % 3);
        const b = Math.floor(i / 3);
        this.setFunctionModule(a, b, color);
        this.setFunctionModule(b, a, color);
      }
    }

    drawFinderPattern(x: number, y: number) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          const xx = x + dx;
          const yy = y + dy;
          if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size) {
            this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
          }
        }
      }
    }

    drawAlignmentPattern(x: number, y: number) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }

    setFunctionModule(x: number, y: number, isDark: boolean) {
      this.modules[y][x] = isDark;
      this.isFunction[y][x] = true;
    }

    addEccAndInterleave(data: number[]) {
      const ver = this.version;
      const ecl = this.errorCorrectionLevel;
      const numBlocks = _QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
      const blockEccLen = _QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
      const rawCodewords = Math.floor(_QrCode.getNumRawDataModules(ver) / 8);
      const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
      const shortBlockLen = Math.floor(rawCodewords / numBlocks);
      const blocks: number[][] = [];
      const rsDiv = _QrCode.reedSolomonComputeDivisor(blockEccLen);
      for (let i = 0, k = 0; i < numBlocks; i++) {
        const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
        k += dat.length;
        const ecc = _QrCode.reedSolomonComputeRemainder(dat, rsDiv);
        if (i < numShortBlocks) dat.push(0);
        blocks.push(dat.concat(ecc));
      }
      const result: number[] = [];
      for (let i = 0; i < blocks[0].length; i++) {
        blocks.forEach((block, j) => {
          if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
        });
      }
      return result;
    }

    drawCodewords(data: number[]) {
      let i = 0;
      for (let right = this.size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < this.size; vert++) {
          for (let j = 0; j < 2; j++) {
            const x = right - j;
            const upward = ((right + 1) & 2) === 0;
            const y = upward ? this.size - 1 - vert : vert;
            if (!this.isFunction[y][x] && i < data.length * 8) {
              this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
              i++;
            }
          }
        }
      }
    }

    applyMask(mask: number) {
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          let invert = false;
          switch (mask) {
            case 0:
              invert = (x + y) % 2 === 0;
              break;
            case 1:
              invert = y % 2 === 0;
              break;
            case 2:
              invert = x % 3 === 0;
              break;
            case 3:
              invert = (x + y) % 3 === 0;
              break;
            case 4:
              invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
              break;
            case 5:
              invert = ((x * y) % 2) + ((x * y) % 3) === 0;
              break;
            case 6:
              invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
              break;
            case 7:
              invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
              break;
          }
          if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
        }
      }
    }

    getPenaltyScore() {
      let result = 0;
      for (let y = 0; y < this.size; y++) {
        let runColor = false;
        let runX = 0;
        const runHistory = [0, 0, 0, 0, 0, 0, 0];
        for (let x = 0; x < this.size; x++) {
          if (this.modules[y][x] === runColor) {
            runX++;
            if (runX === 5) result += _QrCode.PENALTY_N1;
            else if (runX > 5) result++;
          } else {
            this.finderPenaltyAddHistory(runX, runHistory);
            if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * _QrCode.PENALTY_N3;
            runColor = this.modules[y][x];
            runX = 1;
          }
        }
        result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * _QrCode.PENALTY_N3;
      }
      for (let x = 0; x < this.size; x++) {
        let runColor = false;
        let runY = 0;
        const runHistory = [0, 0, 0, 0, 0, 0, 0];
        for (let y = 0; y < this.size; y++) {
          if (this.modules[y][x] === runColor) {
            runY++;
            if (runY === 5) result += _QrCode.PENALTY_N1;
            else if (runY > 5) result++;
          } else {
            this.finderPenaltyAddHistory(runY, runHistory);
            if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * _QrCode.PENALTY_N3;
            runColor = this.modules[y][x];
            runY = 1;
          }
        }
        result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * _QrCode.PENALTY_N3;
      }
      for (let y = 0; y < this.size - 1; y++) {
        for (let x = 0; x < this.size - 1; x++) {
          const color = this.modules[y][x];
          if (
            color === this.modules[y][x + 1] &&
            color === this.modules[y + 1][x] &&
            color === this.modules[y + 1][x + 1]
          ) {
            result += _QrCode.PENALTY_N2;
          }
        }
      }
      let dark = 0;
      for (const row of this.modules) dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
      const total = this.size * this.size;
      const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
      result += k * _QrCode.PENALTY_N4;
      return result;
    }

    getAlignmentPatternPositions() {
      if (this.version === 1) return [];
      const numAlign = Math.floor(this.version / 7) + 2;
      const step = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
      const result = [6];
      for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
      return result;
    }

    static getNumRawDataModules(ver: number) {
      let result = (16 * ver + 128) * ver + 64;
      if (ver >= 2) {
        const numAlign = Math.floor(ver / 7) + 2;
        result -= (25 * numAlign - 10) * numAlign - 55;
        if (ver >= 7) result -= 36;
      }
      return result;
    }

    static getNumDataCodewords(ver: number, ecl: any) {
      return (
        Math.floor(_QrCode.getNumRawDataModules(ver) / 8) -
        _QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] *
          _QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver]
      );
    }

    static reedSolomonComputeDivisor(degree: number) {
      const result: number[] = [];
      for (let i = 0; i < degree - 1; i++) result.push(0);
      result.push(1);
      let root = 1;
      for (let i = 0; i < degree; i++) {
        for (let j = 0; j < result.length; j++) {
          result[j] = _QrCode.reedSolomonMultiply(result[j], root);
          if (j + 1 < result.length) result[j] ^= result[j + 1];
        }
        root = _QrCode.reedSolomonMultiply(root, 2);
      }
      return result;
    }

    static reedSolomonComputeRemainder(data: number[], divisor: number[]) {
      const result = divisor.map(() => 0);
      for (const b of data) {
        const factor = b ^ (result.shift() as number);
        result.push(0);
        divisor.forEach((coef, i) => (result[i] ^= _QrCode.reedSolomonMultiply(coef, factor)));
      }
      return result;
    }

    static reedSolomonMultiply(x: number, y: number) {
      let z = 0;
      for (let i = 7; i >= 0; i--) {
        z = (z << 1) ^ ((z >>> 7) * 285);
        z ^= ((y >>> i) & 1) * x;
      }
      return z;
    }

    finderPenaltyCountPatterns(runHistory: number[]) {
      const n = runHistory[1];
      const core =
        n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
      return (
        (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) +
        (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0)
      );
    }

    finderPenaltyTerminateAndCount(currentRunColor: boolean, currentRunLength: number, runHistory: number[]) {
      if (currentRunColor) {
        this.finderPenaltyAddHistory(currentRunLength, runHistory);
        currentRunLength = 0;
      }
      currentRunLength += this.size;
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      return this.finderPenaltyCountPatterns(runHistory);
    }

    finderPenaltyAddHistory(currentRunLength: number, runHistory: number[]) {
      if (runHistory[0] === 0) currentRunLength += this.size;
      runHistory.pop();
      runHistory.unshift(currentRunLength);
    }
  };

  function appendBits(val: number, len: number, bb: number[]) {
    for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
  }

  function getBit(x: number, i: number) {
    return ((x >>> i) & 1) !== 0;
  }

  const _QrSegment = class _QrSegment {
    mode: any;
    numChars: number;
    bitData: number[];
    static NUMERIC_REGEX = /^[0-9]*$/;
    static ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
    static ALPHANUMERIC_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
    static Mode: any;

    constructor(mode: any, numChars: number, bitData: number[]) {
      this.mode = mode;
      this.numChars = numChars;
      this.bitData = bitData.slice();
    }

    static makeBytes(data: number[]) {
      const bb: number[] = [];
      for (const b of data) appendBits(b, 8, bb);
      return new _QrSegment(_QrSegment.Mode.BYTE, data.length, bb);
    }

    static makeNumeric(digits: string) {
      const bb: number[] = [];
      for (let i = 0; i < digits.length; ) {
        const n = Math.min(digits.length - i, 3);
        appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
        i += n;
      }
      return new _QrSegment(_QrSegment.Mode.NUMERIC, digits.length, bb);
    }

    static makeAlphanumeric(text: string) {
      const bb: number[] = [];
      let i: number;
      for (i = 0; i + 2 <= text.length; i += 2) {
        let temp = _QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
        temp += _QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
        appendBits(temp, 11, bb);
      }
      if (i < text.length) appendBits(_QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
      return new _QrSegment(_QrSegment.Mode.ALPHANUMERIC, text.length, bb);
    }

    static makeSegments(text: string) {
      if (text === '') return [];
      if (_QrSegment.NUMERIC_REGEX.test(text)) return [_QrSegment.makeNumeric(text)];
      if (_QrSegment.ALPHANUMERIC_REGEX.test(text)) return [_QrSegment.makeAlphanumeric(text)];
      return [_QrSegment.makeBytes(_QrSegment.toUtf8ByteArray(text))];
    }

    getData() {
      return this.bitData.slice();
    }

    static getTotalBits(segs: any[], version: number) {
      let result = 0;
      for (const seg of segs) {
        const ccbits = seg.mode.numCharCountBits(version);
        if (seg.numChars >= 1 << ccbits) return Infinity;
        result += 4 + ccbits + seg.bitData.length;
      }
      return result;
    }

    static toUtf8ByteArray(str: string) {
      str = encodeURI(str);
      const result: number[] = [];
      for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) !== '%') result.push(str.charCodeAt(i));
        else {
          result.push(parseInt(str.substring(i + 1, i + 3), 16));
          i += 2;
        }
      }
      return result;
    }
  };

  _QrCode.Ecc = {
    LOW: { ordinal: 0, formatBits: 1 },
    MEDIUM: { ordinal: 1, formatBits: 0 },
    QUARTILE: { ordinal: 2, formatBits: 3 },
    HIGH: { ordinal: 3, formatBits: 2 },
  };

  const makeMode = (modeBits: number, numBitsCharCount: number[]) => ({
    modeBits,
    numBitsCharCount,
    numCharCountBits(ver: number) {
      return numBitsCharCount[Math.floor((ver + 7) / 17)];
    },
  });

  _QrSegment.Mode = {
    NUMERIC: makeMode(1, [10, 12, 14]),
    ALPHANUMERIC: makeMode(2, [9, 11, 13]),
    BYTE: makeMode(4, [8, 16, 16]),
    KANJI: makeMode(8, [8, 10, 12]),
    ECI: makeMode(7, [0, 0, 0]),
  };

  qrcodegen2.QrCode = _QrCode;
  qrcodegen2.QrSegment = _QrSegment;
})(qrcodegen);

function generateSvgPath(modules: boolean[][], margin = 4): string {
  const ops: string[] = [];
  modules.forEach((row, y) => {
    let start: number | null = null;
    row.forEach((cell, x) => {
      if (!cell && start !== null) {
        ops.push(`M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`);
        start = null;
        return;
      }
      if (x === row.length - 1) {
        if (!cell) return;
        if (start === null) {
          ops.push(`M${x + margin},${y + margin} h1v1H${x + margin}z`);
        } else {
          ops.push(`M${start + margin},${y + margin} h${x + 1 - start}v1H${start + margin}z`);
        }
        return;
      }
      if (cell && start === null) {
        start = x;
      }
    });
  });
  return ops.join('');
}

/**
 * Generates an inline SVG QR Code markup string (matching QRCodeSVG from qrcode.react).
 */
export function renderQrCodeSvg(value: string, size: number = 168): string {
  try {
    const qr = qrcodegen.QrCode.encodeText(value || 'TCYytM1g3xjPo9KR7Sky4ibpZgB9MxL7PH', qrcodegen.QrCode.Ecc.MEDIUM);
    const cells: boolean[][] = qr.getModules();
    const margin = 4;
    const numCells = cells.length + margin * 2;
    const fgPath = generateSvgPath(cells, margin);

    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="${size}"
        height="${size}"
        viewBox="0 0 ${numCells} ${numCells}"
        shape-rendering="crispEdges"
        role="img"
        aria-label="암호화폐 입금 주소 QR 코드"
      >
        <path fill="#FFFFFF" d="M0,0 h${numCells}v${numCells}H0z" />
        <path fill="#000000" d="${fgPath}" />
      </svg>
    `;
  } catch (err) {
    console.warn('[qrCodeSvg] Failed to encode QR SVG:', err);
    return `<div class="w-[168px] h-[168px] bg-white border border-stone-300 flex items-center justify-center text-xs">QR</div>`;
  }
}
