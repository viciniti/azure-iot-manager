import {Manager} from "./lib/Manager";
import {ClientConfig} from "./lib/entities/ClientConfig";

const toExport = {
    init
}

function init(config: ClientConfig) {
    return new Manager(config);
}

export = toExport;