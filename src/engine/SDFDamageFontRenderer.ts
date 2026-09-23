// ─── SDF Damage Font WebGL Instanced Quad Renderer ──────────────────────────
import { CombatCameraSystem } from './CombatCameraSystem';

export type DamageTextType = 'normal' | 'crit' | 'weak' | 'crush' | 'heal' | 'miss';

export interface FloatingDamageInstance {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  color: [number, number, number, number]; // RGBA 0..1
  scale: number;
  maxScale: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: DamageTextType;
}

const MAX_INSTANCES = 256;

// Pre-defined glyph coordinates in atlas (standard 16-col grid in 256x256 texture)
const GLYPH_CHARS = "0123456789+-!KMCRITWEASH ";
const GLYPH_MAP = new Map<string, number>();
for (let i = 0; i < GLYPH_CHARS.length; i++) {
  GLYPH_MAP.set(GLYPH_CHARS[i], i);
}

export class SDFDamageFontRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private program: WebGLProgram | null = null;
  private atlasTexture: WebGLTexture | null = null;

  // WebGL Locations
  private uCameraOffsetLoc: WebGLUniformLocation | null = null;
  private uResolutionLoc: WebGLUniformLocation | null = null;
  private uAtlasLoc: WebGLUniformLocation | null = null;
  private aPositionLoc: number = -1;
  private aTexCoordLoc: number = -1;

  // Buffers
  private quadVbo: WebGLBuffer | null = null;
  private texCoordVbo: WebGLBuffer | null = null;

  // Object Pool for zero-GC performance
  private pool: FloatingDamageInstance[] = [];

  constructor() {
    for (let i = 0; i < MAX_INSTANCES; i++) {
      this.pool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        text: '',
        color: [1, 1, 1, 1],
        scale: 1,
        maxScale: 1,
        alpha: 1,
        life: 0,
        maxLife: 1.0,
        type: 'normal'
      });
    }
  }

  /**
   * Initialize WebGL renderer with SDF texture atlas
   */
  public init(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    try {
      this.gl = (canvas.getContext('webgl', { alpha: true, antialias: false, depth: false }) ||
                 canvas.getContext('experimental-webgl', { alpha: true, antialias: false, depth: false })) as WebGLRenderingContext;
    } catch {
      this.gl = null;
    }

    if (!this.gl) {
      // Fallback to high-performance 2D context
      this.ctx2d = canvas.getContext('2d');
      return Boolean(this.ctx2d);
    }

    const gl = this.gl;
    const vsSource = `
      precision mediump float;
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform vec2 u_resolution;
      uniform vec2 u_cameraOffset;
      varying vec2 v_texCoord;

      void main() {
        // Apply camera shake directly in vertex shader
        vec2 pos = a_position + u_cameraOffset;
        vec2 zeroToOne = pos / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_atlas;
      uniform vec4 u_textColor;

      void main() {
        // Signed Distance Field (SDF) sampling
        float dist = texture2D(u_atlas, v_texCoord).a;
        
        // Edge smoothing & high-contrast outline
        float edge = 0.5;
        float width = 0.08;
        float alpha = smoothstep(edge - width, edge + width, dist);
        
        // Dark outline ring
        float outlineAlpha = smoothstep(0.35, 0.45, dist);
        vec3 finalColor = mix(vec3(0.05, 0.05, 0.08), u_textColor.rgb, alpha);
        
        gl_FragColor = vec4(finalColor, max(alpha, outlineAlpha * 0.75) * u_textColor.a);
      }
    `;

    const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return false;

    this.program = gl.createProgram();
    if (!this.program) return false;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.warn('[SDFDamageFontRenderer] Program link failed:', gl.getProgramInfoLog(this.program));
      return false;
    }

    gl.useProgram(this.program);
    this.aPositionLoc = gl.getAttribLocation(this.program, 'a_position');
    this.aTexCoordLoc = gl.getAttribLocation(this.program, 'a_texCoord');
    this.uCameraOffsetLoc = gl.getUniformLocation(this.program, 'u_cameraOffset');
    this.uResolutionLoc = gl.getUniformLocation(this.program, 'u_resolution');
    this.uAtlasLoc = gl.getUniformLocation(this.program, 'u_atlas');

    this.quadVbo = gl.createBuffer();
    this.texCoordVbo = gl.createBuffer();

    this.generateSdfAtlas(gl);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return true;
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.warn('[SDFDamageFontRenderer] Shader error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  /**
   * Generates procedural SDF font atlas texture
   */
  private generateSdfAtlas(gl: WebGLRenderingContext): void {
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = 512;
    atlasCanvas.height = 256;
    const ctx = atlasCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 256);

    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    // 16 columns x 8 rows
    const cellW = 32;
    const cellH = 32;

    for (let i = 0; i < GLYPH_CHARS.length; i++) {
      const col = i % 16;
      const row = Math.floor(i / 16);
      const cx = col * cellW + cellW / 2;
      const cy = row * cellH + cellH / 2;
      ctx.fillText(GLYPH_CHARS[i], cx, cy);
    }

    this.atlasTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /**
   * Spawn a floating damage number or status callout
   */
  public spawnDamage(
    x: number,
    y: number,
    amount: number | string,
    type: DamageTextType = 'normal'
  ): void {
    // Find inactive instance in pool
    let inst = this.pool.find(item => !item.active);
    if (!inst) {
      // Recycle oldest instance
      inst = this.pool[0];
    }

    inst.active = true;
    inst.x = x + (Math.random() * 20 - 10);
    inst.y = y;
    inst.text = typeof amount === 'number' ? Math.round(amount).toString() : amount;
    inst.type = type;
    inst.life = 0;

    // Velocity & scale by damage type
    switch (type) {
      case 'crush':
        inst.maxLife = 1.3;
        inst.maxScale = 2.4;
        inst.scale = 0.5; // pop-in zoom
        inst.vx = (Math.random() - 0.5) * 40;
        inst.vy = -180;
        inst.color = [1.0, 0.2, 0.35, 1.0]; // Intense Crimson
        break;
      case 'crit':
        inst.maxLife = 1.1;
        inst.maxScale = 1.9;
        inst.scale = 0.6;
        inst.vx = (Math.random() - 0.5) * 35;
        inst.vy = -140;
        inst.color = [1.0, 0.75, 0.1, 1.0]; // Vibrant Amber Gold
        break;
      case 'weak':
        inst.maxLife = 1.0;
        inst.maxScale = 1.6;
        inst.scale = 0.7;
        inst.vx = (Math.random() - 0.5) * 30;
        inst.vy = -120;
        inst.color = [0.2, 0.8, 1.0, 1.0]; // Electric Cyan
        break;
      case 'heal':
        inst.maxLife = 1.1;
        inst.maxScale = 1.5;
        inst.scale = 0.8;
        inst.vx = (Math.random() - 0.5) * 20;
        inst.vy = -100;
        inst.color = [0.2, 0.95, 0.45, 1.0]; // Emerald Green
        break;
      case 'miss':
        inst.maxLife = 0.8;
        inst.maxScale = 1.2;
        inst.scale = 0.9;
        inst.vx = (Math.random() - 0.5) * 25;
        inst.vy = -80;
        inst.color = [0.7, 0.7, 0.75, 0.9]; // Slate Gray
        break;
      default:
        inst.maxLife = 0.85;
        inst.maxScale = 1.3;
        inst.scale = 0.8;
        inst.vx = (Math.random() - 0.5) * 25;
        inst.vy = -100;
        inst.color = [0.95, 0.95, 0.95, 1.0]; // Clean White
        break;
    }
  }

  /**
   * Update all floating damage instances
   */
  public update(dt: number): void {
    const gravity = 180; // pixels / sec^2

    for (let i = 0; i < this.pool.length; i++) {
      const inst = this.pool[i];
      if (!inst.active) continue;

      inst.life += dt;
      if (inst.life >= inst.maxLife) {
        inst.active = false;
        continue;
      }

      // Physics
      inst.x += inst.vx * dt;
      inst.y += inst.vy * dt;
      inst.vy += gravity * dt;

      // Pop-in bounce then smooth float
      const progress = inst.life / inst.maxLife;
      if (progress < 0.2) {
        // Zoom-in pop phase
        const popRatio = progress / 0.2;
        inst.scale = inst.scale + (inst.maxScale - inst.scale) * popRatio;
      } else {
        inst.scale = inst.maxScale;
      }

      // Fade out in last 30% of lifespan
      if (progress > 0.7) {
        inst.alpha = Math.max(0, 1.0 - (progress - 0.7) / 0.3);
      } else {
        inst.alpha = 1.0;
      }
    }
  }

  /**
   * Render frame using single-pass WebGL or 2D fallback
   */
  public render(camera: CombatCameraSystem): void {
    if (!this.canvas) return;

    const [camX, camY] = camera.getOffset();

    // 2D Fallback Path
    if (this.ctx2d) {
      const ctx = this.ctx2d;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.save();
      ctx.translate(camX, camY);

      for (const inst of this.pool) {
        if (!inst.active) continue;
        ctx.save();
        ctx.globalAlpha = inst.alpha;
        ctx.font = `900 ${Math.round(20 * inst.scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // High-contrast stroke
        ctx.lineWidth = 4 * inst.scale;
        ctx.strokeStyle = '#050505';
        ctx.strokeText(inst.text, inst.x, inst.y);

        // Fill
        const [r, g, b] = inst.color;
        ctx.fillStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
        ctx.fillText(inst.text, inst.x, inst.y);
        ctx.restore();
      }

      ctx.restore();
      return;
    }

    // WebGL Path
    if (!this.gl || !this.program) return;
    const gl = this.gl;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniform2f(this.uResolutionLoc, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uCameraOffsetLoc, camX, camY);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.uniform1i(this.uAtlasLoc, 0);

    const uTextColorLoc = gl.getUniformLocation(this.program, 'u_textColor');

    for (const inst of this.pool) {
      if (!inst.active) continue;

      const [r, g, b, baseA] = inst.color;
      gl.uniform4f(uTextColorLoc, r, g, b, baseA * inst.alpha);

      // Render text string character by character with instanced quad layout
      const str = inst.text;
      const charWidth = 18 * inst.scale;
      const charHeight = 24 * inst.scale;
      const totalWidth = str.length * charWidth;
      let startX = inst.x - totalWidth / 2;

      for (let c = 0; c < str.length; c++) {
        const char = str[c];
        const glyphIdx = GLYPH_MAP.get(char.toUpperCase()) ?? 0;
        const col = glyphIdx % 16;
        const row = Math.floor(glyphIdx / 16);

        // UV coords in atlas
        const u0 = col / 16.0;
        const v0 = row / 8.0;
        const u1 = (col + 1) / 16.0;
        const v1 = (row + 1) / 8.0;

        const x0 = startX;
        const y0 = inst.y - charHeight / 2;
        const x1 = startX + charWidth;
        const y1 = inst.y + charHeight / 2;

        const positions = new Float32Array([
          x0, y0,
          x1, y0,
          x0, y1,
          x0, y1,
          x1, y0,
          x1, y1
        ]);

        const texCoords = new Float32Array([
          u0, v0,
          u1, v0,
          u0, v1,
          u0, v1,
          u1, v0,
          u1, v1
        ]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.aPositionLoc);
        gl.vertexAttribPointer(this.aPositionLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordVbo);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.aTexCoordLoc);
        gl.vertexAttribPointer(this.aTexCoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        startX += charWidth;
      }
    }
  }

  public dispose(): void {
    if (this.gl) {
      if (this.quadVbo) this.gl.deleteBuffer(this.quadVbo);
      if (this.texCoordVbo) this.gl.deleteBuffer(this.texCoordVbo);
      if (this.atlasTexture) this.gl.deleteTexture(this.atlasTexture);
      if (this.program) this.gl.deleteProgram(this.program);
    }
    this.gl = null;
    this.ctx2d = null;
    this.canvas = null;
  }
}
