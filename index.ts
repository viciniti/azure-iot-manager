import {Config} from "./lib/types/Config";
import {AzureIoTManager} from "./lib/AzureIoTManager";

export function init(config: Config) : AzureIoTManager {
    return new AzureIoTManager(config);
}