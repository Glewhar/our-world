/**
 * Coordinate conversions matching the data-pipeline's Z-up astronomy convention.
 *
 * The pipeline's `lonlat_to_xyz` (data-pipeline/src/earth_pipeline/geom.py:55)
 * is the source of truth:
 *
 *     x = cos(lat) · cos(lon)
 *     y = cos(lat) · sin(lon)
 *     z = sin(lat)
 *
 * That puts +Z at the north pole, +X at (lat=0, lon=0), and +Y at
 * (lat=0, lon=+90°). The .glb mesh tiles are written with vertex POSITIONs
 * in this exact frame (no axis swap in `bake_meshes.py` or `glb.py`), so the
 * runtime keeps the same convention end-to-end. Three.js's default Y-up does
 * not apply here — `scene-graph.ts` sets `camera.up = (0, 0, 1)` so OrbitControls
 * orbits about the Z-axis pole.
 *
 * Picking uses `xyzToLatLon` on a hit point on the unit sphere; the lat/lon
 * is then fed to HEALPix `zPhiToPix` via `(z = sin(lat), phi = lon · π/180)`.
 */

import * as THREE from 'three';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** (lat°, lon°) on a unit sphere → THREE.Vector3 in Z-up frame. */
export function latLonToXyz(latDeg: number, lonDeg: number, target?: THREE.Vector3): THREE.Vector3 {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  const cosLat = Math.cos(lat);
  const out = target ?? new THREE.Vector3();
  return out.set(cosLat * Math.cos(lon), cosLat * Math.sin(lon), Math.sin(lat));
}

/** Unit-sphere XYZ → (lat°, lon°) in Z-up frame. */
export function xyzToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  // Clamp to [-1, 1] in case the hit point is fractionally outside the unit
  // sphere from float drift; asin would NaN otherwise.
  const z = Math.max(-1, Math.min(1, v.z));
  return {
    lat: Math.asin(z) * RAD,
    lon: Math.atan2(v.y, v.x) * RAD,
  };
}
