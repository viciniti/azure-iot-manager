import {ResourceGroup} from "./core/ResourceGroup";
import {Config} from "./entities/Config";
import {ClientConfig} from "./entities/ClientConfig";
import {ClientAuthenticator} from "./auth/ClientAuthenticator";
import {IoTHub} from "./core/IoTHub";
import {DPS} from "./core/DPS";

export class AzureIoTManager {

    public ResourceGroup?: ResourceGroup;

    public IoTHub?: IoTHub;

    public DPS?: DPS;

    constructor(config: Config) {
        if(config instanceof ClientConfig){
            const authenticator = new ClientAuthenticator(config);
            this.ResourceGroup = new ResourceGroup(config.subscriptionId, authenticator);
            this.IoTHub = new IoTHub(config.subscriptionId, authenticator);
            this.DPS = new DPS(config.subscriptionId, authenticator);
        }
    }
}