/**
 * CPU mirror of the 9-tap elevation-lift recipe used by the cities and
 * highways vertex shaders. Runs once at layer construction (or rebake
 * after terraforming), writes the resulting metres-of-lift into an
 * `aLiftMeters` per-vertex attribute, and lets the vertex shader skip
 * the per-frame 9 elevation `texelFetch`es + 8 ocean-id `texelFetch`es.
 *
 * The consuming shader multiplies `aLiftMeters * uElevationScale`, so
 * the altitude-exaggeration slider keeps working. Bias terms
 * (`uCityRadialBias` / `uHighwayRadialBiasM`) stay in the shader.
 *
 * Two coast-fade strategies, one per layer:
 *   - 'ocean-count-8': mirrors the cities shader. Counts how many of
 *     the 8 neighbouring HEALPix cells read as ocean (`bodyIndex == 0`),
 *     fades = (1 - oceans/8)².
 *   - 'distance-field': mirrors the highways shader. Bilinear-samples
 *     the equirect coast-km channel and returns smoothstep(0, 4 km).
 *     `null` here degrades to "fully on land everywhere", matching the
 *     shader's fallback path when the bake didn't ship.
 */
import * as THREE from 'three';
import { zPhiToPix } from '../../world/healpix.js';
const KERNEL_EPS = 3.0e-3;
const KERNEL_DIAG = 0.7071;
/** Half-float decode via Three's built-in. */
function decodeHalf(u16) {
    return THREE.DataUtils.fromHalfFloat(u16);
}
/**
 * Bilinear sample the coast-km channel at a unit-sphere direction.
 * Wraps U (longitude is cyclic, RepeatWrapping in the GPU texture),
 * clamps V (latitude, ClampToEdgeWrapping). RGFormat → stride 2; we
 * read channel R.
 */
function sampleDistFieldCoastKm(dirX, dirY, dirZ, df) {
    const phi = Math.atan2(dirY, dirX);
    const z = Math.max(-1, Math.min(1, dirZ));
    const theta = Math.asin(z);
    const u = (phi + Math.PI) / (2 * Math.PI);
    const v = (Math.PI / 2 - theta) / Math.PI;
    const W = df.width;
    const H = df.height;
    let uPix = u * W - 0.5;
    let vPix = Math.min(H - 1, Math.max(0, v * H - 0.5));
    uPix = ((uPix % W) + W) % W;
    const u0 = Math.floor(uPix);
    const u1 = (u0 + 1) % W;
    const v0 = Math.floor(vPix);
    const v1 = Math.min(v0 + 1, H - 1);
    const uFrac = uPix - u0;
    const vFrac = vPix - v0;
    const r00 = decodeHalf(df.data[(v0 * W + u0) * 2] ?? 0);
    const r10 = decodeHalf(df.data[(v0 * W + u1) * 2] ?? 0);
    const r01 = decodeHalf(df.data[(v1 * W + u0) * 2] ?? 0);
    const r11 = decodeHalf(df.data[(v1 * W + u1) * 2] ?? 0);
    const top = r00 * (1 - uFrac) + r10 * uFrac;
    const bot = r01 * (1 - uFrac) + r11 * uFrac;
    return top * (1 - vFrac) + bot * vFrac;
}
/** smoothstep(edge0, edge1, x) — GLSL semantics. */
function smoothstep(edge0, edge1, x) {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}
/**
 * Compute the lift in metres at the given unit-sphere direction. The
 * shader expects `max(elev, 0) * coastFade` — we return exactly that.
 * The vertex shader multiplies by `uElevationScale` so the lift tracks
 * the altitude slider live (no rebake on slider drag).
 *
 * Mirrors `land.vert.glsl` / `cities.vert.glsl` / `highways.vert.glsl`
 * within float precision: same kernel epsilon, same diagonal weight,
 * same neighbour layout.
 */
export function bakeLiftMeters(dirX, dirY, dirZ, ctx) {
    // Normalise the input direction — callers pass raw vertex positions
    // which sit on the unit sphere modulo float drift.
    const dlen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
    const dx = dirX / dlen;
    const dy = dirY / dlen;
    const dz = dirZ / dlen;
    // Tangent-plane basis at this direction, pole-safe.
    let auX = 0, auY = 0, auZ = 1;
    if (Math.abs(dz) >= 0.99) {
        auX = 1;
        auY = 0;
        auZ = 0;
    }
    // t1 = normalize(cross(axisUp, dir))
    let t1x = auY * dz - auZ * dy;
    let t1y = auZ * dx - auX * dz;
    let t1z = auX * dy - auY * dx;
    const t1len = Math.sqrt(t1x * t1x + t1y * t1y + t1z * t1z) || 1;
    t1x /= t1len;
    t1y /= t1len;
    t1z /= t1len;
    // t2 = cross(dir, t1) — orthonormal by construction (dir, t1 unit & perp)
    const t2x = dy * t1z - dz * t1y;
    const t2y = dz * t1x - dx * t1z;
    const t2z = dx * t1y - dy * t1x;
    const eps = KERNEL_EPS;
    const diagE = KERNEL_DIAG * eps;
    // 9 sample directions; d0 is the centre. Each branch normalises.
    const dirs = [
        [dx, dy, dz],
        normalize3(dx + t1x * eps, dy + t1y * eps, dz + t1z * eps),
        normalize3(dx - t1x * eps, dy - t1y * eps, dz - t1z * eps),
        normalize3(dx + t2x * eps, dy + t2y * eps, dz + t2z * eps),
        normalize3(dx - t2x * eps, dy - t2y * eps, dz - t2z * eps),
        normalize3(dx + (t1x + t2x) * diagE, dy + (t1y + t2y) * diagE, dz + (t1z + t2z) * diagE),
        normalize3(dx + (t1x - t2x) * diagE, dy + (t1y - t2y) * diagE, dz + (t1z - t2z) * diagE),
        normalize3(dx - (t1x - t2x) * diagE, dy - (t1y - t2y) * diagE, dz - (t1z - t2z) * diagE),
        normalize3(dx - (t1x + t2x) * diagE, dy - (t1y + t2y) * diagE, dz - (t1z + t2z) * diagE),
    ];
    let elevSum = 0;
    let oceanCount = 0;
    for (let i = 0; i < 9; i++) {
        const di = dirs[i];
        const ipix = zPhiToPix(ctx.nside, ctx.ordering, di[2], Math.atan2(di[1], di[0]));
        elevSum += ctx.world.getElevationMetersAtCell(ipix);
        // Only the 8 neighbours feed the ocean count (matches the shader).
        if (i > 0 && ctx.world.getBodyIndexAtCell(ipix) === 0)
            oceanCount++;
    }
    const elev = elevSum / 9;
    let coastFade;
    if (ctx.coastFade.kind === 'distance-field') {
        const distKm = sampleDistFieldCoastKm(dx, dy, dz, ctx.coastFade);
        coastFade = smoothstep(0, 4, distKm);
    }
    else {
        const f = 1 - oceanCount / 8;
        coastFade = f * f;
    }
    return Math.max(elev, 0) * coastFade;
}
function normalize3(x, y, z) {
    const l = Math.sqrt(x * x + y * y + z * z) || 1;
    return [x / l, y / l, z / l];
}
