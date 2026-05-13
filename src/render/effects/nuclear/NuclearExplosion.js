// Self-contained nuclear-explosion particle system, ported from the
// nuke-theta demo (bundle.pretty.js:19780–19909). One THREE.Points mesh
// + one ShaderMaterial + JS-side particle state.
//
// Frame conventions:
//   - The Group's *local* frame is the demo's frame: local +Y is "up
//     (away from ground)". Ground-spread particles fan out in the local
//     XZ plane; vertical columns rise along local +Y.
//   - `detonate(direction)` rotates this local frame so local +Y aligns
//     with the outward radial direction at the impact point on the unit
//     globe. The shader math is unchanged — the orientation is the only
//     thing that distinguishes "off a flat plane" from "off the planet
//     surface".
import * as THREE from 'three';
import { PARTICLE_FRAGMENT_SHADER, PARTICLE_VERTEX_SHADER, } from './shaders.js';
import { PARTICLES_TO_GENERATE, } from './particleTypes.js';
// The demo uses SIZE_SCALE = SIZE_MOD / 14 with SIZE_MOD default 6, i.e.
// 0.4286. Times an additional scene-level scale on the points host.
// The demo's scene is roughly tens-of-units across. On our unit globe
// (radius = 1), 0.02 covered the whole planet; the city-scale look
// lives ~15× smaller.
const SIZE_SCALE = 6 / 14;
const EXPLOSION_WORLD_SCALE = 0.015;
const PLANET_RADIUS = 1.0;
// Camera FOV in the host scene. PerspectiveCamera(45°) in scene-graph.ts.
// `pointMultiplier` is the demo's screen-pixel scale factor, derived
// from the projection so that a particle's `size` attribute is roughly
// pixel-equivalent.
const CAMERA_FOV_DEG = 45;
class LinearSpline {
    _lerp;
    _points = [];
    constructor(_lerp) {
        this._lerp = _lerp;
    }
    addPoint(t, d) {
        this._points.push([t, d]);
    }
    get(t) {
        let p1 = 0;
        for (let i = 0; i < this._points.length && this._points[i][0] < t; i++) {
            p1 = i;
        }
        const p2 = Math.min(this._points.length - 1, p1 + 1);
        if (p1 === p2)
            return this._points[p1][1];
        const range = this._points[p2][0] - this._points[p1][0];
        const local = range === 0 ? 0 : (t - this._points[p1][0]) / range;
        return this._lerp(local, this._points[p1][1], this._points[p2][1]);
    }
}
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}
function makeNumberSpline() {
    return new LinearSpline((t, a, b) => a + t * (b - a));
}
function makeColourSpline() {
    return new LinearSpline((t, a, b) => a.clone().lerp(b, t));
}
function buildSplines(cfg) {
    const out = {
        alpha: makeNumberSpline(),
        speed: makeNumberSpline(),
        size: makeNumberSpline(),
        colour: makeColourSpline(),
    };
    for (let i = 0; i < cfg.spleens.alpha.length; i++) {
        out.alpha.addPoint(cfg.intervals[i], cfg.maxValues.alpha * cfg.spleens.alpha[i]);
    }
    for (let i = 0; i < cfg.spleens.speed.length; i++) {
        out.speed.addPoint(cfg.intervals[i], cfg.maxValues.speed * cfg.spleens.speed[i]);
    }
    for (let i = 0; i < cfg.spleens.size.length; i++) {
        out.size.addPoint(cfg.intervals[i], cfg.maxValues.size * cfg.spleens.size[i]);
    }
    if (cfg.spleens.height && cfg.maxValues.height !== undefined) {
        out.height = makeNumberSpline();
        for (let i = 0; i < cfg.spleens.height.length; i++) {
            out.height.addPoint(cfg.intervals[i], cfg.maxValues.height * cfg.spleens.height[i]);
        }
    }
    for (let i = 0; i < cfg.spleens.colour.length; i++) {
        const kf = cfg.spleens.colour[i];
        const colour = new THREE.Color(i === 0 ? cfg.startColour : cfg.endColour);
        out.colour.addPoint(kf.interval, colour);
    }
    return out;
}
export class NuclearExplosion {
    group;
    _camera;
    _material;
    _geometry;
    _points;
    _textures;
    _splinesByType;
    _particles = [];
    _running = false;
    _tmpCameraLocal = new THREE.Vector3();
    _tmpDrag = new THREE.Vector3();
    _tmpVel = new THREE.Vector3();
    constructor(camera) {
        this._camera = camera;
        const loader = new THREE.TextureLoader();
        this._textures = [
            loader.load(new URL('./sprites/fire_desat.png', import.meta.url).href),
            loader.load(new URL('./sprites/smoke_blur.png', import.meta.url).href),
            loader.load(new URL('./sprites/debris.png', import.meta.url).href),
        ];
        // Initial point multiplier guess; updated via setViewportHeight().
        // We bake EXPLOSION_WORLD_SCALE in here because gl_PointSize doesn't
        // go through the model matrix — group.scale shrinks particle positions
        // but sprite pixel sizes stay raw unless we compensate here. Without
        // this, particles cluster tightly but sprites stay huge, making the
        // whole blast collapse into one undifferentiated blob with no
        // mushroom structure visible.
        const initialHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
        const pointMultiplier = (initialHeight / (2 * Math.tan((CAMERA_FOV_DEG * Math.PI) / 360))) *
            EXPLOSION_WORLD_SCALE;
        this._material = new THREE.ShaderMaterial({
            uniforms: {
                u_texturez: { value: this._textures },
                pointMultiplier: { value: pointMultiplier },
            },
            vertexShader: PARTICLE_VERTEX_SHADER,
            fragmentShader: PARTICLE_FRAGMENT_SHADER,
            glslVersion: THREE.GLSL3,
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
        });
        this._geometry = new THREE.BufferGeometry();
        this._geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
        this._geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
        this._geometry.setAttribute('colour', new THREE.Float32BufferAttribute([], 4));
        this._geometry.setAttribute('angle', new THREE.Float32BufferAttribute([], 1));
        this._geometry.setAttribute('blend', new THREE.Float32BufferAttribute([], 1));
        this._geometry.setAttribute('type', new THREE.Int32BufferAttribute([], 1));
        this._points = new THREE.Points(this._geometry, this._material);
        this._points.frustumCulled = false;
        this.group = new THREE.Group();
        this.group.add(this._points);
        this.group.scale.setScalar(EXPLOSION_WORLD_SCALE);
        this._splinesByType = new Map();
        for (const cfg of PARTICLES_TO_GENERATE) {
            this._splinesByType.set(cfg.particleType, buildSplines(cfg));
        }
    }
    // Called once per resize so `gl_PointSize` stays in screen pixels.
    // EXPLOSION_WORLD_SCALE is folded in for the same reason as the
    // constructor — sprite size must scale with position scale to keep
    // the mushroom-vs-fireball proportions intact.
    setViewportHeight(heightPx) {
        const pm = (heightPx / (2 * Math.tan((CAMERA_FOV_DEG * Math.PI) / 360))) *
            EXPLOSION_WORLD_SCALE;
        this._material.uniforms.pointMultiplier.value = pm;
    }
    detonate(direction) {
        const dir = direction.clone().normalize();
        this.group.position.copy(dir).multiplyScalar(PLANET_RADIUS);
        this.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        this.group.updateMatrixWorld(true);
        this._reset();
        this._running = true;
    }
    update(deltaSec) {
        if (!this._running)
            return;
        this._updateParticles(deltaSec);
        this._updateGeometry();
        if (this._particles.length === 0) {
            this._running = false;
        }
    }
    dispose() {
        this._geometry.dispose();
        this._material.dispose();
        for (const tex of this._textures)
            tex.dispose();
    }
    _reset() {
        this._particles = [];
        for (const cfg of PARTICLES_TO_GENERATE) {
            if (!cfg.enabled)
                continue;
            for (let i = 0; i < cfg.count; i++) {
                this._particles.push(this._createParticle(cfg));
            }
        }
    }
    _createParticle(cfg) {
        // Random outward direction in the XZ plane (mod by radiusModifier so
        // some types can squish their spread anisotropically).
        const dir = new THREE.Vector3((Math.random() - 0.5) * cfg.radiusModifier, Math.random() - 0.5, (Math.random() - 0.5) * cfg.radiusModifier).normalize();
        const radius = randomBetween(cfg.minRadius, cfg.maxRadius);
        const radiusPerc = cfg.maxRadius === cfg.minRadius ? 1 : (cfg.maxRadius - radius) / (cfg.maxRadius - cfg.minRadius);
        dir.multiplyScalar(radius);
        const xz_x = dir.x;
        const xz_z = dir.z;
        const minSize = cfg.minSize ?? 0;
        const maxSize = cfg.maxSize ?? 1;
        const rawSize = randomBetween(minSize, maxSize) * cfg.sizeMod;
        const initialSize = cfg.growingOnly
            ? cfg.sizeMod * (1 - radiusPerc)
            : cfg.dynamicSize
                ? rawSize * (radiusPerc + (cfg.radiusMod ?? 0))
                : rawSize;
        const life = randomBetween(cfg.lifeTime.minLife, cfg.lifeTime.maxLife);
        const startPosY = randomBetween(cfg.minHeight ?? 0, cfg.maxHeight ?? 0.5);
        const startPos = new THREE.Vector3(0, startPosY, 0);
        const velocity = cfg.vertical
            ? new THREE.Vector3(0, 1, 0)
            : new THREE.Vector3(xz_x, 0, xz_z);
        return {
            particleType: cfg.particleType,
            alpha: cfg.alpha,
            blend: cfg.blend,
            colour: new THREE.Color(0xffffff),
            velocity,
            position: startPos,
            originalPosition: startPos.clone(),
            size: initialSize * SIZE_SCALE,
            currentSize: initialSize * SIZE_SCALE,
            life,
            maxLife: life,
            rotation: 2 * Math.random() * Math.PI,
            rotationModifier: randomBetween(-1, 1),
        };
    }
    _updateParticles(deltaSec) {
        // Decrement life and prune dead particles.
        for (const p of this._particles)
            p.life -= deltaSec;
        this._particles = this._particles.filter((p) => p.life > 0);
        for (const p of this._particles) {
            const t = 1 - p.life / p.maxLife;
            const splines = this._splinesByType.get(p.particleType);
            const timeDilate = splines.speed.get(t);
            p.alpha = splines.alpha.get(t);
            p.currentSize = p.size * splines.size.get(t);
            p.colour.copy(splines.colour.get(t));
            if (splines.height) {
                p.position.y = p.originalPosition.y + splines.height.get(t);
            }
            const dt = deltaSec * timeDilate;
            p.rotation += dt * p.rotationModifier;
            this._tmpVel.copy(p.velocity).multiplyScalar(dt);
            p.position.add(this._tmpVel);
            // Drag: subtract 10% × dt of velocity, clamped so it never reverses sign.
            this._tmpDrag.copy(p.velocity).multiplyScalar(0.1 * dt);
            this._tmpDrag.x =
                Math.sign(p.velocity.x) * Math.min(Math.abs(this._tmpDrag.x), Math.abs(p.velocity.x));
            this._tmpDrag.y =
                Math.sign(p.velocity.y) * Math.min(Math.abs(this._tmpDrag.y), Math.abs(p.velocity.y));
            this._tmpDrag.z =
                Math.sign(p.velocity.z) * Math.min(Math.abs(this._tmpDrag.z), Math.abs(p.velocity.z));
            p.velocity.sub(this._tmpDrag);
        }
        // Back-to-front sort against the camera (in this group's local space)
        // for stable transparency. The demo sorts in world space, but with
        // CustomBlending(OneFactor, OneMinusSrcAlpha) the order matters for
        // the smoke layer's straight-alpha contribution.
        this._tmpCameraLocal.copy(this._camera.position);
        this._points.worldToLocal(this._tmpCameraLocal);
        this._particles.sort((a, b) => {
            const da = this._tmpCameraLocal.distanceToSquared(a.position);
            const db = this._tmpCameraLocal.distanceToSquared(b.position);
            return db - da;
        });
    }
    _updateGeometry() {
        const n = this._particles.length;
        const positions = new Float32Array(n * 3);
        const sizes = new Float32Array(n);
        const colours = new Float32Array(n * 4);
        const angles = new Float32Array(n);
        const blends = new Float32Array(n);
        const types = new Int32Array(n);
        for (let i = 0; i < n; i++) {
            const p = this._particles[i];
            positions[i * 3 + 0] = p.position.x;
            positions[i * 3 + 1] = p.position.y;
            positions[i * 3 + 2] = p.position.z;
            sizes[i] = p.currentSize;
            colours[i * 4 + 0] = p.colour.r;
            colours[i * 4 + 1] = p.colour.g;
            colours[i * 4 + 2] = p.colour.b;
            colours[i * 4 + 3] = p.alpha;
            angles[i] = p.rotation;
            blends[i] = p.blend;
            types[i] = p.particleType;
        }
        this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this._geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        this._geometry.setAttribute('colour', new THREE.Float32BufferAttribute(colours, 4));
        this._geometry.setAttribute('angle', new THREE.Float32BufferAttribute(angles, 1));
        this._geometry.setAttribute('blend', new THREE.Float32BufferAttribute(blends, 1));
        this._geometry.setAttribute('type', new THREE.Int32BufferAttribute(types, 1));
    }
}
