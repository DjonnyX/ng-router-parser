export const BRACE_EXPRESSION_PATTERN = /({.*?})/gm;
export const BRACE_SYMBOLS_PATTERN = /[{|}]/gm;
export const WHITESPACE_PATTERN = /\s/g;
export const IMPORT_LINE_PATTERN = /(?=import).([^;]+;)/gm;
export const IMPORT_LINE_PATH_PATTERN = /(['|"]+.*?['|"])/gm;
export const QUOTE_EXPRESSION_PATTERN = /['|"]/gm;
export const ROUTES_FTAG_PATTERN = /(?=:.*Routes.*=).([^\[]+)/gm;
export const ROUTES_MAP_PATTERN = /(?=:.*Routes.*=.*\[).([^;]+.*\].*;)/gm;