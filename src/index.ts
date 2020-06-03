import RoutingParser from "./RoutingParser";

const args = process.argv.slice(2);

if (args.length === 0) {
    throw Error("Необходимо указать корневой *-routing.module.ts");
}

const rootRoutingModule = args[0];
const outputPath = args.length > 1 ? args[1] : "routes";
const formatType = args.length > 2 ? args[2] : "txt";

const rParser = new RoutingParser();

// Парсинг маршрутов
rParser.parse(rootRoutingModule);

// Экспорт
rParser.export(outputPath, formatType);

rParser.dispose();