/**
 * Shared GLSL `paletteAt(int idx)` function for the legacy 15-entry biome
 * palette. Both BiomeColorEquirect's horizontal-blur pass and LandMaterial's
 * fragment shader concatenate this string into their source so they look up
 * biome colours the same way.
 *
 * Each consuming shader must declare its own `uniform vec3 uPalette[15];`
 * line — this file owns only the function body. Keeping the uniform decl
 * at the call site means callers can size the array themselves if needed
 * (currently 15 in both call sites).
 *
 * The legacy unrolled if-chain dodges the GPU subset that disallows dynamic
 * uniform-array indexing in fragment shaders.
 */

export const PALETTE_AT_GLSL = /* glsl */ `
vec3 paletteAt(int idx) {
  if (idx <= 0)  return uPalette[0];
  if (idx == 1)  return uPalette[1];
  if (idx == 2)  return uPalette[2];
  if (idx == 3)  return uPalette[3];
  if (idx == 4)  return uPalette[4];
  if (idx == 5)  return uPalette[5];
  if (idx == 6)  return uPalette[6];
  if (idx == 7)  return uPalette[7];
  if (idx == 8)  return uPalette[8];
  if (idx == 9)  return uPalette[9];
  if (idx == 10) return uPalette[10];
  if (idx == 11) return uPalette[11];
  if (idx == 12) return uPalette[12];
  if (idx == 13) return uPalette[13];
  return uPalette[14];
}
`;
