const PATH_SEGMENT_PATTERN = /([\w-\.])+(?:[\\/|\w])/g;

/**
 * Парсинг пути в массив сегментов
 * @param {string} path
 * @return {Array<string>}
 */
export const parsePath = (path: string): string[] => {
    if (PATH_SEGMENT_PATTERN.test(path)) {
        return path.match(PATH_SEGMENT_PATTERN).map(v => v.replace(/([\/|/])/, ""));
    }
    return [];
}