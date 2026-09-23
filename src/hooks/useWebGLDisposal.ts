/**
 * useWebGLDisposal.ts - SCR-04-28
 * WebGL 텍스처, 셰이더, 버퍼의 메모리 누수를 방지하는 자동 리소스 해제 훅.
 */

import { useEffect, useRef, type RefObject } from 'react';

export function useWebGLDisposal(glRef: RefObject<WebGLRenderingContext | WebGL2RenderingContext | null>) {
  const texturesRef = useRef<WebGLTexture[]>([]);
  const buffersRef = useRef<WebGLBuffer[]>([]);
  const programsRef = useRef<WebGLProgram[]>([]);

  const registerTexture = (tex: WebGLTexture) => {
    texturesRef.current.push(tex);
  };

  const registerBuffer = (buf: WebGLBuffer) => {
    buffersRef.current.push(buf);
  };

  const registerProgram = (prog: WebGLProgram) => {
    programsRef.current.push(prog);
  };

  useEffect(() => {
    return () => {
      const gl = glRef.current;
      if (!gl) return;

      texturesRef.current.forEach((t) => gl.deleteTexture(t));
      buffersRef.current.forEach((b) => gl.deleteBuffer(b));
      programsRef.current.forEach((p) => gl.deleteProgram(p));

      texturesRef.current = [];
      buffersRef.current = [];
      programsRef.current = [];
    };
  }, [glRef]);

  return { registerTexture, registerBuffer, registerProgram };
}
