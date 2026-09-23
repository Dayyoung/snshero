/**
 * VictoryFanfareRenderer.ts - SCR-08-28
 * WebGL-based single-draw-call particle shader system for 3-star stamps,
 * victory confetti, and level-up fanfare without triggering DOM reflows.
 */

export interface ParticleDef {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotSpeed: number;
  r: number;
  g: number;
  b: number;
  a: number;
  life: number;
  maxLife: number;
  type: 'confetti' | 'sparkle' | 'star';
}

export class VictoryFanfareRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private particles: ParticleDef[] = [];
  private maxParticles = 400;
  private fallback2D: CanvasRenderingContext2D | null = null;

  init(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false });

    if (!this.gl) {
      this.fallback2D = canvas.getContext('2d');
      return !!this.fallback2D;
    }

    const vsSource = `
      attribute vec2 a_pos;
      attribute vec2 a_quad;
      attribute float a_size;
      attribute vec4 a_color;
      attribute float a_rot;
      uniform vec2 u_res;
      varying vec4 v_color;
      varying vec2 v_uv;

      void main() {
        float c = cos(a_rot);
        float s = sin(a_rot);
        mat2 rotMat = mat2(c, -s, s, c);
        vec2 localPos = rotMat * (a_quad * a_size);
        vec2 screenPos = a_pos + localPos;

        vec2 zeroToOne = screenPos / u_res;
        vec2 clipSpace = (zeroToOne * 2.0 - 1.0) * vec2(1.0, -1.0);
        gl_Position = vec4(clipSpace, 0.0, 1.0);

        v_color = a_color;
        v_uv = a_quad + 0.5;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec4 v_color;
      varying vec2 v_uv;

      void main() {
        // Circle falloff for sparkles or rounded confetti
        float dist = length(v_uv - 0.5);
        if (dist > 0.5) discard;
        gl_FragColor = v_color;
      }
    `;

    const vs = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      this.fallback2D = canvas.getContext('2d');
      return true;
    }

    this.program = this.gl.createProgram();
    if (!this.program) return false;

    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      this.fallback2D = canvas.getContext('2d');
      return true;
    }

    this.vertexBuffer = this.gl.createBuffer();
    return true;
  }

  private compileShader(type: number, src: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  triggerFanfare(x: number, y: number, count = 120): void {
    const colors = [
      [1.0, 0.84, 0.0],  // Gold
      [0.2, 0.9, 1.0],   // Cyan
      [1.0, 0.3, 0.5],   // Rose
      [0.4, 1.0, 0.4],   // Emerald
      [1.0, 1.0, 1.0],   // White
      [0.9, 0.5, 1.0]    // Purple
    ];

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 200 + Math.random() * 450;
      const col = colors[Math.floor(Math.random() * colors.length)];
      const maxLife = 1.2 + Math.random() * 1.0;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 150,
        size: 8 + Math.random() * 12,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8,
        r: col[0],
        g: col[1],
        b: col[2],
        a: 1.0,
        life: 0,
        maxLife,
        type: Math.random() < 0.6 ? 'confetti' : 'sparkle'
      });
    }
  }

  triggerStarBurst(starIndex: number, x: number, y: number): void {
    const burstCount = 35 + starIndex * 15;
    for (let i = 0; i < burstCount; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 320;
      const maxLife = 0.8 + Math.random() * 0.7;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 10 + Math.random() * 14,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 12,
        r: 1.0,
        g: 0.88 + Math.random() * 0.12,
        b: 0.2 + Math.random() * 0.4,
        a: 1.0,
        life: 0,
        maxLife,
        type: 'star'
      });
    }
  }

  update(dt: number): void {
    const gravity = 480;
    const friction = 0.985;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.vx *= friction;
      p.vy = (p.vy + gravity * dt) * friction;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.rotSpeed * dt;

      // Fade out smoothly
      const progress = p.life / p.maxLife;
      p.a = 1.0 - Math.pow(progress, 2);
    }
  }

  render(): void {
    if (!this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;

    if (this.fallback2D) {
      const ctx = this.fallback2D;
      ctx.clearRect(0, 0, width, height);
      for (const p of this.particles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(${Math.round(p.r * 255)}, ${Math.round(p.g * 255)}, ${Math.round(p.b * 255)}, ${p.a})`;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    if (!this.gl || !this.program || !this.vertexBuffer) return;
    const gl = this.gl;

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (this.particles.length === 0) return;

    gl.useProgram(this.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uResLoc = gl.getUniformLocation(this.program, 'u_res');
    gl.uniform2f(uResLoc, width, height);

    // Build vertex data: 6 vertices per particle (2 triangles)
    // Layout: [posX, posY, quadX, quadY, size, r, g, b, a, rot] (10 floats per vert)
    const stride = 10;
    const vertexData = new Float32Array(this.particles.length * 6 * stride);
    const quad = [
      -0.5, -0.5,
       0.5, -0.5,
      -0.5,  0.5,
      -0.5,  0.5,
       0.5, -0.5,
       0.5,  0.5
    ];

    let offset = 0;
    for (const p of this.particles) {
      for (let v = 0; v < 6; v++) {
        const qx = quad[v * 2];
        const qy = quad[v * 2 + 1];
        vertexData[offset++] = p.x;
        vertexData[offset++] = p.y;
        vertexData[offset++] = qx;
        vertexData[offset++] = qy;
        vertexData[offset++] = p.size;
        vertexData[offset++] = p.r;
        vertexData[offset++] = p.g;
        vertexData[offset++] = p.b;
        vertexData[offset++] = p.a;
        vertexData[offset++] = p.rot;
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);

    const bpe = Float32Array.BYTES_PER_ELEMENT;
    const totalStride = stride * bpe;

    const aPosLoc = gl.getAttribLocation(this.program, 'a_pos');
    const aQuadLoc = gl.getAttribLocation(this.program, 'a_quad');
    const aSizeLoc = gl.getAttribLocation(this.program, 'a_size');
    const aColorLoc = gl.getAttribLocation(this.program, 'a_color');
    const aRotLoc = gl.getAttribLocation(this.program, 'a_rot');

    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, totalStride, 0);

    gl.enableVertexAttribArray(aQuadLoc);
    gl.vertexAttribPointer(aQuadLoc, 2, gl.FLOAT, false, totalStride, 2 * bpe);

    gl.enableVertexAttribArray(aSizeLoc);
    gl.vertexAttribPointer(aSizeLoc, 1, gl.FLOAT, false, totalStride, 4 * bpe);

    gl.enableVertexAttribArray(aColorLoc);
    gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, totalStride, 5 * bpe);

    gl.enableVertexAttribArray(aRotLoc);
    gl.vertexAttribPointer(aRotLoc, 1, gl.FLOAT, false, totalStride, 9 * bpe);

    gl.drawArrays(gl.TRIANGLES, 0, this.particles.length * 6);
  }

  dispose(): void {
    if (this.gl && this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
    this.particles = [];
  }
}
