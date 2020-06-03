import RJSON from 'relaxed-json';

/**
 * Преобразование в валидный JSON
 * @param {string} src
 * @return {string}
 */
export const sanitizeJSON = (src: string): string => {
    return RJSON.transform(src);
}