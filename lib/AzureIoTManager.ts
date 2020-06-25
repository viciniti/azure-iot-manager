import {ResourceGroup} from "./core/ResourceGroup";
import {Config} from "./entities/Config";
import {ClientConfig} from "./entities/ClientConfig";
import {ClientAuthenticator} from "./auth/ClientAuthenticator";
import {IoTHub} from "./core/IoTHub";
import {DPS} from "./core/DPS";

export class AzureIoTManager {

    public resourceGroup?: ResourceGroup;

    public iotHub?: IoTHub;

    public dps?: DPS;

    constructor(config: Config) {
        if(config instanceof ClientConfig){
            const authenticator = new ClientAuthenticator(config);
            this.resourceGroup = new ResourceGroup(config.subscriptionId, authenticator);
            this.iotHub = new IoTHub(config.subscriptionId, authenticator);
            this.dps = new DPS(config.subscriptionId, authenticator);
        }
    }


}