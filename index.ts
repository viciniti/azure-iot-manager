import {Config} from "./lib/entities/Config";
import {AzureIoTManager} from "./lib/AzureIoTManager";

export function init(config: Config) : AzureIoTManager {
    return new AzureIoTManager(config);
}