// Inlined from healpix.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// HEALPix \`zphiToPix\` — GLSL port of web/src/world/healpix.ts.
//
// Used by the globe fragment shader to map a unit-sphere fragment position
// (z = sin(lat), phi = lon) to the HEALPix cell index that addresses
// \`uIdRaster\` and \`uAttrDynamic\`.
//
// Parity with the TS canonical lookup is asserted by
// web/src/world/__tests__/healpix-glsl-parity.test.ts via a TS shim that
// mirrors GLSL int semantics (truncating divide). When editing this file,
// keep healpix-glsl-shim.ts line-for-line in sync.
//
// Bit operations require GLSL3 (\`#version 300 es\`). Three.js sets that via
// \`glslVersion: THREE.GLSL3\`. nside is bounded by the bake at <= 4096, so
// 12*nside^2 fits in int32.

const float HEALPIX_TWO_PI = 6.28318530717958647693;
const float HEALPIX_HALF_PI = 1.57079632679489661923;
const float HEALPIX_TWO_THIRDS = 0.6666666666666667;

int healpixSpreadBits(int n) {
  int x = n & 0xffff;
  x = (x | (x << 8)) & 0x00ff00ff;
  x = (x | (x << 4)) & 0x0f0f0f0f;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;
  return x;
}

int healpixXyToMorton(int ix, int iy) {
  return healpixSpreadBits(ix) | (healpixSpreadBits(iy) << 1);
}

// Floor division for ints (mirrors JS Math.floor(a/b) for negative numerators).
int healpixFloorDiv(int a, int b) {
  return int(floor(float(a) / float(b)));
}

int healpixAngToPixRing(int nside, float z, float tt) {
  float za = abs(z);
  int nl4 = 4 * nside;
  float fns = float(nside);

  if (za <= HEALPIX_TWO_THIRDS) {
    float temp1 = fns * (0.5 + tt);
    float temp2 = fns * 0.75 * z;
    int jp = int(floor(temp1 - temp2));
    int jm = int(floor(temp1 + temp2));
    if (z == 0.0 && jp == jm) jp -= 1;
    int ir = nside + 1 + jp - jm;
    int kshift = 1 - (ir & 1);
    int ip = healpixFloorDiv(jp + jm - nside + kshift + 1, 2);
    ip = ((ip % nl4) + nl4) % nl4;
    int ncap = 2 * nside * (nside - 1);
    return ncap + (ir - 1) * nl4 + ip;
  }

  float tp = tt - floor(tt);
  float tmp = fns * sqrt(3.0 * (1.0 - za));
  int jp = int(floor(tp * tmp));
  int jm = int(floor((1.0 - tp) * tmp));
  int ir = jp + jm + 1;
  int ip = int(mod(tt * float(ir), 4.0 * float(ir)));
  if (ip < 0) ip += 4 * ir;
  if (z > 0.0) {
    return 2 * ir * (ir - 1) + ip;
  }
  return 12 * nside * nside - 2 * ir * (ir + 1) + ip;
}

int healpixAngToPixNested(int nside, float z, float tt) {
  float za = abs(z);
  int face;
  int ix;
  int iy;
  float fns = float(nside);

  if (za <= HEALPIX_TWO_THIRDS) {
    float temp1 = fns * (0.5 + tt);
    float temp2 = fns * 0.75 * z;
    int jp = int(floor(temp1 - temp2));
    int jm = int(floor(temp1 + temp2));
    if (z == 0.0 && jp == jm) jp -= 1;
    int ifp = healpixFloorDiv(jp, nside);
    int ifm = healpixFloorDiv(jm, nside);
    if (ifp == ifm) face = (ifp & 3) | 4;
    else if (ifp < ifm) face = ifp & 3;
    else face = (ifm & 3) + 8;
    ix = ((jm % nside) + nside) % nside;
    iy = nside - 1 - (((jp % nside) + nside) % nside);
  } else {
    int ntt = min(3, int(floor(tt)));
    float tp = tt - float(ntt);
    float tmp = fns * sqrt(3.0 * (1.0 - za));
    int jp = int(floor(tp * tmp));
    int jm = int(floor((1.0 - tp) * tmp));
    int jpC = min(nside - 1, jp);
    int jmC = min(nside - 1, jm);
    if (z >= 0.0) {
      face = ntt;
      ix = nside - jmC - 1;
      iy = nside - jpC - 1;
    } else {
      face = ntt + 8;
      ix = jpC;
      iy = jmC;
    }
  }
  return face * nside * nside + healpixXyToMorton(ix, iy);
}

// ordering: 0 = ring, 1 = nested.
int healpixZPhiToPix(int nside, int ordering, float z, float phi) {
  float phiNorm = mod(mod(phi, HEALPIX_TWO_PI) + HEALPIX_TWO_PI, HEALPIX_TWO_PI);
  float tt = mod(phiNorm / HEALPIX_HALF_PI, 4.0);
  if (ordering == 0) return healpixAngToPixRing(nside, z, tt);
  return healpixAngToPixNested(nside, z, tt);
}

// Decompose a flat HEALPix pixel index into (col, row) for sampling a 2D
// texture of width = 4*nside, height = 3*nside. Mirrors IdRaster.toDataTexture.
ivec2 healpixIpixToTexel(int ipix, int width) {
  return ivec2(ipix % width, ipix / width);
}

// Unit-sphere direction → equirectangular UV. Lon = atan2(y,x) maps to U;
// lat = asin(z) maps to V (V=0 at the north pole, V=1 at the south).
// Shared by every shader that bilinear-samples one of the equirect bakes
// (distance field, elevation equirect, …).
vec2 sphereDirToEquirectUv(vec3 d) {
  float phi = atan(d.y, d.x);
  float theta = asin(clamp(d.z, -1.0, 1.0));
  return vec2(
    (phi + 3.14159265) * (1.0 / 6.28318530),
    (1.5707963 - theta) * (1.0 / 3.14159265)
  );
}

// id-raster unpack helpers — see web/src/world/IdRaster.ts for the GPU
// layout. The id raster is now RGBA8, body index packed across R/G/B
// (24 bits, plenty for any Earth bake) with A as a sentinel:
//   A = 0   → ocean (body id == 0)
//   A = 255 → land  (body id  > 0)
// Mali fast-paths RGBA8 sampling but slow-paths R32_UINT, so the alpha
// sentinel keeps the hot is-ocean test a single byte compare rather than
// a full 24-bit unpack.
bool isOceanIdTexel(vec4 t) {
  return t.a < 0.5;
}

uint unpackBodyId(vec4 t) {
  if (t.a < 0.5) return 0u;
  return uint(t.r * 255.0 + 0.5)
       | (uint(t.g * 255.0 + 0.5) << 8)
       | (uint(t.b * 255.0 + 0.5) << 16);
}
`;
