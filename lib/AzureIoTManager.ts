import {ResourceGroupManager} from "./resource-group/ResourceGroupManager";
import {Config} from "./types/Config";
import {ClientConfig} from "./types/ClientConfig";
import {ClientAuthenticator} from "./auth/ClientAuthenticator";

export class AzureIoTManager {

    public resourceGroupManager?: ResourceGroupManager;

    constructor(config: Config) {
        if(config instanceof ClientConfig){
            const authenticator = new ClientAuthenticator(config);
            this.resourceGroupManager = new ResourceGroupManager(config.subscriptionId, authenticator);
        }
    }


}