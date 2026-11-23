import assert from "node:assert/strict";
import test from "node:test";
import { pcmToWav } from "./audio.js";

test("pcmToWav writes a valid 48 kHz stereo PCM WAV header", () => {
  const pcm = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);
  const wav = pcmToWav(pcm);

  assert.equal(wav.length, 44 + pcm.length);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.toString("ascii", 8, 12), "WAVE");
  assert.equal(wav.toString("ascii", 12, 16), "fmt ");
  assert.equal(wav.readUInt32LE(16), 16);
  assert.equal(wav.readUInt16LE(20), 1);
  assert.equal(wav.readUInt16LE(22), 2);
  assert.equal(wav.readUInt32LE(24), 48_000);
  assert.equal(wav.readUInt32LE(28), 192_000);
  assert.equal(wav.readUInt16LE(32), 4);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.toString("ascii", 36, 40), "data");
  assert.equal(wav.readUInt32LE(40), pcm.length);
  assert.deepEqual(wav.subarray(44), pcm);
});

test("pcmToWav supports an empty PCM buffer", () => {
  const wav = pcmToWav(Buffer.alloc(0));
  assert.equal(wav.length, 44);
  assert.equal(wav.readUInt32LE(4), 36);
  assert.equal(wav.readUInt32LE(40), 0);
});
