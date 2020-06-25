import {ResourceGroup} from "./core/ResourceGroup";
import {Config} from "./entities/Config";
import {ClientConfig} from "./entities/ClientConfig";
import {ClientAuthenticator} from "./auth/ClientAuthenticator";

export class AzureIoTManager {

    public resourceGroupManager?: ResourceGroup;

    constructor(config: Config) {
        if(config instanceof ClientConfig){
            const authenticator = new ClientAuthenticator(config);
            this.resourceGroupManager = new ResourceGroup(config.subscriptionId, authenticator);
        }
    }


}