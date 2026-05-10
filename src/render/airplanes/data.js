/**
 * Airplane data loaders. Reads the static `airports.json` + `routes.json`
 * produced by `scripts/build-airplane-data.mjs` from `web/airplanes/`.
 *
 * Routes are stored compactly as `{a, b, w}` where a/b index into the
 * airports array. We expand them at load time to flat Float32Arrays so the
 * spawn loop and the GPU instance attributes can read directly.
 */
// Page-relative so the build runs at any deploy path. fetch() resolves
// these against `document.baseURI`.
const AIRPORTS_URL = 'airplanes/airports.json';
const ROUTES_URL = 'airplanes/routes.json';
const EARTH_RADIUS_KM = 6371;
const DEG = Math.PI / 180;
/** Great-circle distance between two lat/lon pairs (degrees) in km. */
function greatCircleKm(latA, lonA, latB, lonB) {
    const φ1 = latA * DEG;
    const φ2 = latB * DEG;
    const Δφ = (latB - latA) * DEG;
    const Δλ = (lonB - lonA) * DEG;
    const a = Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}
/** Midpoint of the great-circle between two lat/lon pairs (degrees → degrees). */
function greatCircleMidpoint(latA, lonA, latB, lonB) {
    const φ1 = latA * DEG;
    const φ2 = latB * DEG;
    const Δλ = (lonB - lonA) * DEG;
    const Bx = Math.cos(φ2) * Math.cos(Δλ);
    const By = Math.cos(φ2) * Math.sin(Δλ);
    const φm = Math.atan2(Math.sin(φ1) + Math.sin(φ2), Math.sqrt((Math.cos(φ1) + Bx) ** 2 + By ** 2));
    const λm = lonA * DEG + Math.atan2(By, Math.cos(φ1) + Bx);
    return { lat: φm / DEG, lon: λm / DEG };
}
export async function loadAirplaneData() {
    const [airportsResp, routesResp] = await Promise.all([
        fetch(AIRPORTS_URL),
        fetch(ROUTES_URL),
    ]);
    if (!airportsResp.ok)
        throw new Error(`airports.json: ${airportsResp.status}`);
    if (!routesResp.ok)
        throw new Error(`routes.json: ${routesResp.status}`);
    const airportsFile = (await airportsResp.json());
    const routesFile = (await routesResp.json());
    const aN = airportsFile.airports.length;
    const airportLatLons = new Float32Array(aN * 2);
    const airportTraffic = new Float32Array(aN);
    const airportIatas = new Array(aN);
    for (let i = 0; i < aN; i++) {
        const a = airportsFile.airports[i];
        airportLatLons[i * 2] = a.lat;
        airportLatLons[i * 2 + 1] = a.lon;
        airportTraffic[i] = a.traffic;
        airportIatas[i] = a.iata;
    }
    const rN = routesFile.routes.length;
    const routeSrc = new Uint32Array(rN);
    const routeDst = new Uint32Array(rN);
    const routeWeight = new Float32Array(rN);
    const routeDistanceKm = new Float32Array(rN);
    const routeMidpointLon = new Float32Array(rN);
    const routeMidpointLat = new Float32Array(rN);
    for (let i = 0; i < rN; i++) {
        const r = routesFile.routes[i];
        routeSrc[i] = r.a;
        routeDst[i] = r.b;
        routeWeight[i] = r.w;
        const latA = airportLatLons[r.a * 2];
        const lonA = airportLatLons[r.a * 2 + 1];
        const latB = airportLatLons[r.b * 2];
        const lonB = airportLatLons[r.b * 2 + 1];
        routeDistanceKm[i] = greatCircleKm(latA, lonA, latB, lonB);
        const m = greatCircleMidpoint(latA, lonA, latB, lonB);
        routeMidpointLat[i] = m.lat * DEG;
        routeMidpointLon[i] = m.lon * DEG;
    }
    console.info(`[airplanes] loaded ${aN} airports, ${rN} routes ` +
        `(median distance ${Math.round(median(routeDistanceKm))} km)`);
    return {
        airportLatLons,
        airportTraffic,
        airportIatas,
        routeSrc,
        routeDst,
        routeWeight,
        routeDistanceKm,
        routeMidpointLon,
        routeMidpointLat,
    };
}
function median(arr) {
    const sorted = Array.from(arr).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
}
