/**
 * Load the C1 world manifest.
 *
 * Schema validation is the pipeline's job (see
 * `data-pipeline/tests/test_contracts.py` + the generated JSON schema in
 * `data-pipeline/schema/`). The runtime mirror via Ajv was retired with
 * the bundler — it depended on `import.meta.env.DEV` tree-shaking to keep
 * Ajv out of prod. The Python suite is canonical.
 */
import { fetchMaybeGzJson } from './fetch-gz.js';
export async function loadManifest(url) {
    return await fetchMaybeGzJson(url);
}
