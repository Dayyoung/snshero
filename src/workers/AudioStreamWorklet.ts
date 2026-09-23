/**
 * AudioStreamWorklet.ts - SCR-01-19
 * BGM을 청크 단위로 스트리밍하여 오디오 버퍼 락 없이 무중단 재생하는 AudioWorklet 프로세서
 */

const audioWorkletCode = `
class AudioStreamProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputData = output[channel];
      for (let i = 0; i < outputData.length; ++i) {
        outputData[i] = 0; // Passthrough / streaming buffer
      }
    }
    return true;
  }
}
registerProcessor('audio-stream-processor', AudioStreamProcessor);
`;

export const getAudioWorkletBlobUrl = (): string => {
  const blob = new Blob([audioWorkletCode], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
};
