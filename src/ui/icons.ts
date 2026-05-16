/**
 * SVG icon factory for the Terraform UI.
 *
 * All glyphs are pure inline `<svg>` strings tinted via `currentColor` so the
 * surrounding container's `color` drives the fill / stroke. Sized via the
 * caller's stylesheet — every icon ships with `width="100%"`-style behaviour
 * by leaving width/height off so CSS can pin them.
 *
 * Two helpers:
 *   - `svg(body, viewBox?)` — wraps a body in an `<svg>` with consistent
 *     defaults (24x24 viewBox, `fill="currentColor"`).
 *   - `stroke(body, viewBox?)` — same but uses stroke-based glyphs.
 *
 * Civilization / population pip states (normal/sick/dying/dead) and city
 * states (normal/burning/collapsed) are exposed as enums so the status
 * panel can swap glyphs by derived health tier.
 */

function svg(body: string, viewBox = '0 0 24 24'): string {
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true">${body}</svg>`;
}

function stroked(body: string, viewBox = '0 0 24 24', sw = 1.8): string {
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* ------------------------------------------------------------------------- */
/* Topbar / chrome                                                            */
/* ------------------------------------------------------------------------- */

export const PauseIcon = svg('<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>');
export const PlayIcon = svg('<path d="M7 4 L19 12 L7 20 Z"/>');
export const BoltIcon = svg('<path d="M13 2 L4 14 H10 L9 22 L20 10 H14 L15 2 Z"/>');

/* ------------------------------------------------------------------------- */
/* Subtle stack: SEA / TEMP / L-W                                             */
/* ------------------------------------------------------------------------- */

export const ThermoIcon = stroked(
  '<path d="M14 14V5a2 2 0 0 0-4 0v9a4 4 0 1 0 4 0z"/><circle cx="12" cy="17" r="1.5" fill="currentColor" stroke="none"/>',
);
export const WaveIcon = stroked(
  '<path d="M3 8c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M3 13c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M3 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/>',
);
export const LandWaterIcon = stroked(
  '<path d="M3 14c1.5-2 3-2 5 0s3.5 2 5 0 3.5-2 5 0"/><path d="M3 19c1.5-2 3-2 5 0s3.5 2 5 0 3.5-2 5 0"/><path d="M7 10l3-5 3 4 3-3 2 4" stroke="#f1e3c5"/>',
);

/* ------------------------------------------------------------------------- */
/* Status panel — biome state                                                 */
/* ------------------------------------------------------------------------- */

export const LeafBalancedIcon = svg('<path d="M20 4c-7 0-12 4-13 11-1 5 3 7 6 6 7-1 11-6 11-13l-4 4"/>');
export const LeafUnbalancedIcon = svg('<path d="M20 4c-7 0-12 4-13 11-1 5 3 7 6 6 7-1 11-6 11-13l-4 4M9 9l-3 9"/>');

/* ------------------------------------------------------------------------- */
/* Status panel — civilization / city / population                            */
/* ------------------------------------------------------------------------- */

export const CityNormalIcon = svg('<path d="M3 21V9l4-3 4 3v3h4V7l3-2 3 2v14H3z"/>');
export const CityBurningIcon = svg(
  '<path d="M3 21V9l4-3 4 3v3h4V7l3-2 3 2v14H3z"/><path d="M11 4c1 2-1 3 0 5s3-1 2-3-2-1-2-2z" fill="#ff7a4d"/>',
);
export const CityCollapsedIcon = svg('<path d="M3 21l3-8 4 2 3-5 4 3 4-4 2 12H3z"/>');

export const PeopleNormalIcon = stroked(
  '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M14 20c0-2 2-4 4-4s3 1 3 3"/>',
);
export const PeopleSickIcon = stroked(
  '<circle cx="12" cy="8" r="3"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/><path d="M9 7l1 2M15 7l-1 2"/>',
);
export const PeopleDyingIcon = stroked(
  '<circle cx="12" cy="8" r="3"/><path d="M5 21c1-3 4-5 7-5s6 2 7 5"/><path d="M10 7l2 2M14 7l-2 2"/>',
);
export const PeopleDeadIcon = svg(
  '<path d="M12 2a7 7 0 0 0-7 7v4l-1 3h3v3h2v-2h6v2h2v-3h3l-1-3V9a7 7 0 0 0-7-7z"/><circle cx="9" cy="11" r="1.4" fill="#1a1207"/><circle cx="15" cy="11" r="1.4" fill="#1a1207"/>',
);

export const RoadIcon = stroked(
  '<path d="M9 3v18"/><path d="M15 3v18"/><path d="M12 5v2M12 11v2M12 17v2"/>',
);
export const RoadCrackingIcon = stroked(
  '<path d="M9 3v18"/><path d="M15 3v18"/><path d="M12 4v1M12 9v1M12 14v1M12 18v1"/><path d="M5 8l3 2 2-3 4 5 2-2 3 3" stroke-width="1.5"/>',
);
export const RoadDestroyedIcon = stroked(
  '<path d="M8 3l1 4-2 1 3 2-1 3 2 1-1 4M16 3l-1 3 2 2-3 2 1 3-2 2 1 3" stroke-width="1.6"/><path d="M3 13l3-1M18 11l3 1" stroke-width="1.4"/>',
);

/* ------------------------------------------------------------------------- */
/* Radiation                                                                  */
/* ------------------------------------------------------------------------- */

export const RadIcon = svg(
  '<circle cx="12" cy="12" r="2.6"/><path d="M12 2a10 10 0 0 1 8.66 5l-5.2 3a4 4 0 0 0-3.46-2V2zM2 14a10 10 0 0 1 1.34-7l5.2 3a4 4 0 0 0-.54 4H2zM12 22a10 10 0 0 1-8.66-5l5.2-3a4 4 0 0 0 3.46 2v6zM22 14a10 10 0 0 1-1.34 7l-5.2-3a4 4 0 0 0 .54-4H22z"/>',
);

/* ------------------------------------------------------------------------- */
/* Biome tile glyphs (inside each hex)                                        */
/* ------------------------------------------------------------------------- */

export const TreeIcon = svg('<path d="M12 2l5 7h-3l4 6h-4l3 5H7l3-5H6l4-6H7l5-7z"/>');
export const PalmIcon = svg('<path d="M12 4c-3 0-6 2-6 5 1-2 3-3 5-3-2 1-4 4-4 7 1-3 3-4 5-4-1 2-2 4-2 9h2c0-5 1-7 2-9 2 0 4 1 5 4 0-3-2-6-4-7 2 0 4 1 5 3 0-3-3-5-6-5z"/>');
export const GrassIcon = svg('<path d="M4 20c2-5 3-8 4-12-1 4-1 8 0 12M9 20c2-5 3-8 4-12-1 4-1 8 0 12M14 20c2-5 3-8 4-12-1 4-1 8 0 12"/>');
export const DesertIcon = svg('<circle cx="17" cy="6" r="3"/><path d="M2 18l4-3 3 2 4-4 4 3 5-2v6H2z"/>');
export const SnowIcon = stroked('<path d="M12 2v20M4 6l16 12M4 18l16-12M2 12h20"/>');
export const OceanIcon = stroked(
  '<path d="M2 10c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2"/><path d="M2 16c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2"/>',
);
export const SkullIcon = svg(
  '<path d="M12 3a8 8 0 0 0-8 8v3l1 2v3h3v-2h2v2h4v-2h2v2h3v-3l1-2v-3a8 8 0 0 0-8-8z"/><circle cx="9" cy="12" r="1.6" fill="#1a1207"/><circle cx="15" cy="12" r="1.6" fill="#1a1207"/>',
);
export const MutantIcon = svg(
  '<path d="M12 2c2 4 5 5 8 5-3 2-4 5-3 9-3-1-6 0-8 3-2-3-5-4-8-3 1-4 0-7-3-9 3 0 6-1 8-5z"/>',
);

/* ------------------------------------------------------------------------- */
/* Disaster rail glyphs                                                       */
/* ------------------------------------------------------------------------- */

export const NukeIcon = svg(
  '<circle cx="12" cy="9" r="4"/><path d="M5 13h14l-2 8H7l-2-8z"/><path d="M9 9a3 3 0 0 1 3-3 3 3 0 0 1 3 3" fill="#1a1207"/>',
);
export const BonfireIcon = svg(
  '<path d="M12 2.5c-.6 1.6 1 2.5 1 4.2 0 1.4-2 2-2 3.8 0 1.6 1.2 2.8 2.7 2.8.6 0 1-.4 1-1 0-1-1-1.4-1-2.4 0-.9 1.2-1.6 1.2-3 0-1.4-1.4-2.4-1.4-3.8 0-.6.3-.9 0-1.2-.3.6-1 .6-1.5-.4z"/>' +
  '<path d="M14.8 9.5c-.4.6.5 1.4.5 2.2 0 .9-1.2 1.4-1.2 2.4 0 .7.5 1.2 1.3 1.2 1.5 0 2.6-1.2 2.6-2.7 0-1.6-2-2.4-3.2-3.1z" opacity="0.85"/>' +
  '<rect x="3" y="17.4" width="18" height="1.6" rx="0.8" transform="rotate(6 12 18.2)"/>' +
  '<rect x="3" y="17.4" width="18" height="1.6" rx="0.8" transform="rotate(-6 12 18.2)"/>' +
  '<circle cx="3.6" cy="18.2" r="0.9"/><circle cx="20.4" cy="18.2" r="0.9"/>',
);
export const WarmingIcon = svg(
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
);
export const IceIcon = stroked('<path d="M12 2v20M4 6l16 12M4 18l16-12M2 12h20M8 4l4 2 4-2M8 20l4-2 4 2"/>');
export const AsteroidIcon = svg(
  '<circle cx="13" cy="11" r="6"/><path d="M2 22l4-4M6 18l3-3" stroke="#ff7a4d" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
);
export const VirusIcon = svg(
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="currentColor" stroke-width="1.8"/>',
);
export const VolcanoIcon = svg(
  '<path d="M3 21l5-12 3 4 3-3 7 11H3z"/><path d="M11 4c1 2-1 3 0 5s3-1 2-3-2-1-2-2z" fill="#ff7a4d"/>',
);
export const TsunamiIcon = stroked(
  '<path d="M2 14c3 0 4-4 8-4s5 4 8 4 4-2 4-2"/><path d="M2 19c3 0 4-2 8-2s5 2 8 2 4-1 4-1"/><path d="M6 9c2-3 5-4 8-3"/>',
);
export const AiIcon = stroked(
  '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 9h6v6H9z"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
);

export const LockIcon = svg('<path d="M6 11V8a6 6 0 0 1 12 0v3"/><rect x="5" y="11" width="14" height="10" rx="2"/>');

/* ------------------------------------------------------------------------- */
/* Collapse / expand chevrons                                                 */
/* ------------------------------------------------------------------------- */

export const CloseIcon = stroked('<path d="M5 5l14 14M19 5L5 19"/>', '0 0 24 24', 2.2);

export const ChevronUpIcon = stroked('<path d="M5 15l7-7 7 7"/>', '0 0 24 24', 2.2);
export const ChevronDownIcon = stroked('<path d="M5 9l7 7 7-7"/>', '0 0 24 24', 2.2);
export const ChevronLeftIcon = stroked('<path d="M15 5l-7 7 7 7"/>', '0 0 24 24', 2.2);
export const ChevronRightIcon = stroked('<path d="M9 5l7 7-7 7"/>', '0 0 24 24', 2.2);
