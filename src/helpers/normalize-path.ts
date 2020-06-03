import { parsePath } from "./path-parser";
import path from "path";

const UP_PATH_PATTERN = /\.\.(?:[\\/]|$)/g;
const RESOLVE_PATH_PATTERN = /(?:^|[\\/])\.(?:[\\/]|$)/;

/**
 * Нормализация пути
 * @param {string} currentPath 
 * @param {string} observedPath
 * @return {string}
 */
export const normalizePath = (currentPath: string, observedPath: string): string => {
    const cpSegments = parsePath(currentPath);
    const obsSegments = parsePath(observedPath);

    if (UP_PATH_PATTERN.test(observedPath)) {
        const entryCount = observedPath.match(UP_PATH_PATTERN).length;
        return cpSegments.slice(0, cpSegments.length - entryCount).concat(obsSegments.slice(entryCount)).join(path.sep);
    } else if (RESOLVE_PATH_PATTERN.test(observedPath)) {
        const entryCount = observedPath.match(RESOLVE_PATH_PATTERN).length;
        return cpSegments.concat(obsSegments.slice(entryCount)).join(path.sep);
    }
    return obsSegments.join(path.sep);
}