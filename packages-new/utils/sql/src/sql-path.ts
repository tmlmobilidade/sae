/* * */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SQL_FILES } from './registry.generated.js';

/* * */

/**
 * A module that ships SQL files under `modules/<module>/sql`.
 */
export type SqlModule = keyof typeof SQL_FILES;

/**
 * A SQL file shipped by a given module, relative to `modules/<module>/sql`.
 */
export type SqlFile<T extends SqlModule> = (typeof SQL_FILES)[T][number] & string;

/* * */

/**
 * Overrides the directory that contains the `modules/` tree. Only meant for
 * tests and for deployments that do not follow the standard layout.
 */
const SQL_ROOT_ENV_VAR = 'GO_SQL_ROOT';

/**
 * SQL files are plain assets, not workspace packages, so they cannot be found
 * through Node module resolution. Instead this file walks up from its own
 * location looking for a directory that holds `modules/<module>/sql`. The
 * target of the search is also its own validation, so no marker file is needed.
 *
 * - Dev / monorepo: this file lives in `packages-new/utils/sql/{src,dist}`, and
 *   the walk stops at the repository root.
 * - Docker runner (`nodejs.dockerfile`): this file lives in
 *   `/app/packages-new/utils/sql/dist`, and the walk stops at `/app`, where the
 *   Dockerfile copies `modules/<module>/sql`.
 */
const selfDir = path.dirname(fileURLToPath(import.meta.url));

/** Resolved SQL roots, keyed by module name. */
const resolvedRoots = new Map<SqlModule, string>();

/**
 * Builds the list of directories to test, nearest first: the environment
 * override, then every ancestor of this file, then the working directory.
 */
function candidateBaseDirs(): string[] {
	const baseDirs: string[] = [];

	const override = process.env[SQL_ROOT_ENV_VAR];
	if (override) {
		baseDirs.push(path.resolve(override));
	}

	let currentDir = selfDir;
	while (true) {
		baseDirs.push(currentDir);
		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) break;
		currentDir = parentDir;
	}

	baseDirs.push(path.resolve(process.cwd()));

	return baseDirs;
}

/**
 * Finds and caches the absolute path to `modules/<module>/sql`.
 * @throws When no candidate directory holds the module's SQL folder.
 */
function resolveModuleSqlRoot(module: SqlModule): string {
	const cachedRoot = resolvedRoots.get(module);
	if (cachedRoot) return cachedRoot;

	const searchedPaths: string[] = [];

	for (const baseDir of candidateBaseDirs()) {
		const candidateRoot = path.join(baseDir, 'modules', module, 'sql');
		searchedPaths.push(candidateRoot);
		if (existsSync(candidateRoot)) {
			resolvedRoots.set(module, candidateRoot);
			return candidateRoot;
		}
	}

	throw new Error(
		`Could not locate "modules/${module}/sql". Searched:\n  ${searchedPaths.join('\n  ')}\n`
		+ `Set ${SQL_ROOT_ENV_VAR} to the directory that contains the "modules" tree if it lives elsewhere.`,
	);
}

/* * */

/**
 * Returns the absolute path to a `.sql` file shipped by a module.
 *
 * Both arguments are checked against the generated registry, so a renamed or
 * deleted SQL file fails at build time instead of at runtime.
 *
 * @param module The module that owns the SQL file.
 * @param file The file path, relative to `modules/<module>/sql`.
 * @returns The absolute path to the file.
 *
 * @example
 * await labDb.queryFromFile(sqlPath('hub', 'eta/loader/load-rides.sql'));
 */
export function sqlPath<T extends SqlModule>(module: T, file: SqlFile<T>): string {
	return path.join(resolveModuleSqlRoot(module), file);
}
