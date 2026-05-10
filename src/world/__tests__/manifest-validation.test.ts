/**
 * Validate the C1 schema against real + tampered manifest payloads.
 *
 * The runtime fetches both via HTTP in DEV; here we exercise the validation
 * step directly using the real on-disk artifacts so a CI break catches drift
 * between `web/src/world/types.ts` and an actual baked manifest.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../..');
const SCHEMA_PATH = resolve(REPO_ROOT, 'data-pipeline/schema/world_manifest.schema.json');
const MANIFEST_PATH = resolve(REPO_ROOT, 'data-pipeline/out/ponds/world_manifest.json');

function compile() {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8')) as object;
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

describe('manifest schema validation', () => {
  it('accepts the baked ponds manifest unmodified', () => {
    const validate = compile();
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as object;
    const ok = validate(manifest);
    if (!ok) throw new Error(`unexpected schema failure: ${JSON.stringify(validate.errors)}`);
    expect(ok).toBe(true);
  });

  it('rejects a manifest with bodies removed', () => {
    const validate = compile();
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as Record<string, unknown>;
    delete manifest.bodies;
    expect(validate(manifest)).toBe(false);
    expect(JSON.stringify(validate.errors)).toContain('bodies');
  });

  it('rejects a manifest with a wrong-typed nside', () => {
    const validate = compile();
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as {
      healpix: { nside: unknown };
    };
    manifest.healpix.nside = 'one thousand twenty-four';
    expect(validate(manifest)).toBe(false);
  });
});
