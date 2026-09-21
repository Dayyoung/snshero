/**
 * GpuParticleBuffer.ts - SCR-08-13
 * 융합 3D 마법 유체 시뮬레이션용 WebGL 핑퐁 버퍼 관리자
 */

export class GpuParticleBuffer {
  private count: number;
  private currentRead = 0;
  private vaos: (WebGLVertexArrayObject | null)[] = [null, null];
  private buffers: WebGLBuffer[][] = [[], []];

  constructor(count = 500) {
    this.count = count;
  }

  public init(gl: WebGL2RenderingContext, program: WebGLProgram): boolean {
    const particleData = new Float32Array(this.count * 5); // pos(2), vel(2), life(1)
    for (let i = 0; i < this.count; i++) {
      const idx = i * 5;
      const angle = (i / this.count) * Math.PI * 2;
      const rad = 0.2 + Math.random() * 0.5;
      particleData[idx] = Math.cos(angle) * rad; // x
      particleData[idx + 1] = Math.sin(angle) * rad; // y
      particleData[idx + 2] = -Math.sin(angle) * 0.2; // vx
      particleData[idx + 3] = Math.cos(angle) * 0.2; // vy
      particleData[idx + 4] = Math.random(); // life
    }

    // Set up 2 buffers for ping-pong
    for (let b = 0; b < 2; b++) {
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      const buf = gl.createBuffer();
      if (!buf) return false;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.DYNAMIC_COPY);

      // Attributes
      const stride = 5 * 4;
      const aPos = gl.getAttribLocation(program, 'a_position');
      const aVel = gl.getAttribLocation(program, 'a_velocity');
      const aLife = gl.getAttribLocation(program, 'a_life');

      if (aPos >= 0) {
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, stride, 0);
      }
      if (aVel >= 0) {
        gl.enableVertexAttribArray(aVel);
        gl.vertexAttribPointer(aVel, 2, gl.FLOAT, false, stride, 2 * 4);
      }
      if (aLife >= 0) {
        gl.enableVertexAttribArray(aLife);
        gl.vertexAttribPointer(aLife, 1, gl.FLOAT, false, stride, 4 * 4);
      }

      this.vaos[b] = vao;
      this.buffers[b] = [buf];
    }

    gl.bindVertexArray(null);
    return true;
  }

  public swap() {
    this.currentRead = 1 - this.currentRead;
  }

  public getReadVao(): WebGLVertexArrayObject | null {
    return this.vaos[this.currentRead];
  }

  public getWriteBuffer(): WebGLBuffer | null {
    return this.buffers[1 - this.currentRead][0] || null;
  }

  public getCount(): number {
    return this.count;
  }
}
