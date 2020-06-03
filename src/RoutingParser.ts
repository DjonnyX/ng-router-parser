import {
    BRACE_EXPRESSION_PATTERN, BRACE_SYMBOLS_PATTERN, WHITESPACE_PATTERN, IMPORT_LINE_PATTERN,
    IMPORT_LINE_PATH_PATTERN, QUOTE_EXPRESSION_PATTERN, ROUTES_FTAG_PATTERN, ROUTES_MAP_PATTERN
} from './helpers/regex';
import { sanitizeJSON } from "./helpers/sanitize-json";
import { normalizePath } from "./helpers/normalize-path";
import { parsePath } from "./helpers/path-parser";
import Exporter from "./Exporter";
import fs from "fs";
import path from "path";

/**
 * Парсер маршрутизации для angular.
 * Метод <code>parse</code> парсит и сериализует модули.
 * Метод <code>export</code> преобразует маршруты и форматирует в зависимости
 * от параметра <code>format</code>, который принимает зачения <code>txt|json</code>
 */
class RoutingParser {

    protected _exporter: Exporter;

    protected _data: string[];

    constructor() {
        this._exporter = new Exporter();
    }

    /**
     * Выполняет загрузку и парсинг модулей
     * @param {string} rootModule
     * @return {void}
     */
    public parse(rootModule: string): void {
        this._parseModule(rootModule);
    }

    /**
     * Экспорт маршрутов в файл
     * @param {string} outputPath 
     * @param {"txt"|"json"|string} format
     * @return {void}
     */
    public export(outputPath: string, format: "txt" | "json" | string): void {
        this._exporter.exportAs(this._data, outputPath, format);
    }

    /**
     * Очистка ссылок перед удалением
     */
    public dispose(): void {
        this._exporter = null;
        this._data = null;
    }

    /**
     * Загружает и парсит модуль
     * @param {string} path
     * @return {void}
     */
    private _parseModule(path: string): void {
        const mFile = this._loadFile(path);
        const routes = this._parseRoutes(mFile);

        this._data = this._normalizeRoutes(routes);

        console.info(this._data.join("\n"));
    }

    /**
     * Парсинг всех импортируемых модулей
     * @param {string} src
     * @return {{[x: string]: string}}
     */
    private _parseImports(src: string, modulePath: string): {[x: string]: string} {
        const result = {};

        const lines = src.match(IMPORT_LINE_PATTERN);
        for (let i = 0, l = lines.length; i < l; i++) {
            this._parseImportedModules(lines[i], modulePath, result);
        }

        return result;
    }

    /**
     * Парсит импортируемые модули и сериализует их в map
     * @param {string} src
     * @param {{[x: string]: string}} result
     * @return {void}
     */
    private _parseImportedModules(src: string, modulePath: string, result: {[x: string]: string}): void {
        const modulesNames = this._parseModulesNames(src);
        const path = this._parsePathToModules(src, modulePath);

        if (!path) throw Error("Путь к импортируемым модулям не найден.");

        for (let i = 0, l = modulesNames.length; i < l; i++) {
            result[modulesNames[i]] = path;
        }
    }

    /**
     * Парсит и возвращает массив имен экспортируемых модулей
     * @param {string} src
     * @return {Array<string>}
     */
    private _parseModulesNames(src: string): Array<string> {
        if (BRACE_EXPRESSION_PATTERN.test(src)) {
            const modulesExp = src.match(BRACE_EXPRESSION_PATTERN)[0].replace(BRACE_SYMBOLS_PATTERN, "");
            return modulesExp.replace(WHITESPACE_PATTERN, "").split(/[.*,.*]/gm);
        }

        return [];
    }

    /**
     * Парсит путь импортируемых модулей
     * @param {string} src
     * @return {string|undefined}
     */
    private _parsePathToModules(src: string, modulePath: string): string | undefined {
        if (IMPORT_LINE_PATH_PATTERN.test(src)) {
            return normalizePath(modulePath, src.match(IMPORT_LINE_PATH_PATTERN)[0].replace(QUOTE_EXPRESSION_PATTERN, ""));
        }
        return undefined;
    }

    /**
     * Парсит объект маршрутизации
     * @param {string} src 
     * @param {string} path
     * @return {Array<string>|undefined}
     */
    private _parseRoutes(src: string, uri: string = ""): string[] | undefined {
        if (ROUTES_MAP_PATTERN.test(src)) {
            const routesStr = src.match(ROUTES_MAP_PATTERN)[0].replace(ROUTES_FTAG_PATTERN, "").replace(";", "");
            const json = JSON.parse(sanitizeJSON(routesStr));

            return this._parseRoutesLinks(json, uri);
        }
        return undefined;
    }

    /**
     * Парсинг путей маршрутов
     * @param {string} absPath
     * @param {Array<string>} src
     * @return {Array<string>}
     */
    private _parseRoutesLinks(src: Array<any>, uri: string): string[] {
        let result = Array<string>();

        for (let i = 0, l = src.length; i < l; i++) {
            const relPath: string = src[i].path;

            if (relPath === undefined) continue;

            const redirectTo = src[i].redirectTo;
            const loadChildren = src[i].loadChildren;
            const newUri = uri ? `${uri}${path.sep}${relPath}` : relPath;

            if (relPath !== "" && !redirectTo) {
                result.push(newUri);
            }

            if (loadChildren) {
                result = result.concat(this._parseLazyModule(loadChildren, newUri));
            } else {
                const children = src[i].children;

                if (children && children.length > 0) {
                    result = result.concat(this._parseRoutesLinks(children, newUri));
                }
            }
        }

        return result;
    }

    /**
     * Парсинг lazy-модуля
     * @param {string} absPath 
     * @param {string} src
     * @return {Array<string>}
     */
    private _parseLazyModule(src: string, uri: string): string[] {
        const currentModulePath = `${src.replace(/#.*/, '')}.ts`;
        const pathToModuleSegments = parsePath(currentModulePath);
        const pathToModule = pathToModuleSegments.slice(0, pathToModuleSegments.length - 1).join(path.sep);
        const moduleName = `${src.match(/#.*/)[0].replace(/#/, "").replace(/Module/, "")}RoutingModule`;

        const lazyModuleFile = this._loadFile(currentModulePath);
        const imports = this._parseImports(lazyModuleFile, pathToModule);

        if (!imports.hasOwnProperty(moduleName)) throw Error(`Не удалось найти RoutingModule в ${currentModulePath}`);

        const routingFilePath = `${normalizePath(pathToModule, imports[moduleName])}.ts`;

        const lazyRoutingModuleFile = this._loadFile(routingFilePath);
        
        return this._parseRoutes(lazyRoutingModuleFile, uri);
    }

    /**
     * Нормализация путей маршрутов
     * @param {Array<string>} routes
     * @return {Array<string>}
     */
    private _normalizeRoutes(routes: string[]): string[] {
        return routes.map(v => v.replace(/[\\/]+/g, "/"));
    }

    /**
     * Загрузка файла по заданному пути
     * @param {string} path 
     * @return {string}
     */
    private _loadFile(path: string): string {
        return fs.readFileSync(path, 'utf-8');
    }
}

export default RoutingParser;