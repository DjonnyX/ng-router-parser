import fs from "fs";

class Exporter {
    /**
     * Экспорт маршрутов
     * @param {Array<string>} routes 
     * @param {"txt"|"json"} outputPath 
     * @param {string} format 
     */
    exportAs(routes: string[], outputPath: string, format: string = "txt") {
        let data = format === "txt" ? this._convertToTxt(routes) : JSON.stringify(routes);
        fs.writeFileSync(outputPath, data);
    }

    /**
     * Конвертация в txt формат
     * @param {Array<string>} routes
     */
    private _convertToTxt(routes: string[]): string {
        return routes.join("\n");
    }
}

export default Exporter;