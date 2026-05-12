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
export function latLonToXyz(latDeg, lonDeg, target) {
    const lat = latDeg * DEG;
    const lon = lonDeg * DEG;
    const cosLat = Math.cos(lat);
    const out = target ?? new THREE.Vector3();
    return out.set(cosLat * Math.cos(lon), cosLat * Math.sin(lon), Math.sin(lat));
}
/** Unit-sphere XYZ → (lat°, lon°) in Z-up frame. */
export function xyzToLatLon(v) {
    // Clamp to [-1, 1] in case the hit point is fractionally outside the unit
    // sphere from float drift; asin would NaN otherwise.
    const z = Math.max(-1, Math.min(1, v.z));
    return {
        lat: Math.asin(z) * RAD,
        lon: Math.atan2(v.y, v.x) * RAD,
    };
}
/**
 * Local 2D tangent basis on the unit sphere at the given lat/lon.
 *
 * `centre` is the unit-sphere position of the basepoint; `tangentX` /
 * `tangentY` are the two orthonormal axes that span the tangent plane.
 * The same construction the cities vertex shader uses, lifted to TS so
 * the urban-detail layer can project polygon vertices CPU-side into
 * each city's local frame.
 *
 * Convention: `tangentX` ≈ east (`+lon`), `tangentY` ≈ north (`+lat`),
 * except very near the poles where `worldUp` flips to keep the cross
 * product well-defined. Both axes are unit length.
 */
export function tangentBasisAt(latDeg, lonDeg) {
    const centre = latLonToXyz(latDeg, lonDeg);
    // Same pole-safe basis the cities vert shader builds: pick a worldUp
    // that isn't parallel to the surface normal, then orthonormalise.
    const worldUp = Math.abs(centre.z) < 0.99
        ? new THREE.Vector3(0, 0, 1)
        : new THREE.Vector3(1, 0, 0);
    const tangentX = new THREE.Vector3().crossVectors(worldUp, centre).normalize();
    const tangentY = new THREE.Vector3().crossVectors(centre, tangentX);
    return { centre, tangentX, tangentY };
}
