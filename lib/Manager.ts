import {ResourceGroup} from "./core/ResourceGroup";
import {Config} from "./entities/Config";
import {ClientConfig} from "./entities/ClientConfig";
import {ClientAuthenticator} from "./auth/ClientAuthenticator";
import {IoTHub} from "./core/IoTHub";
import {DPS} from "./core/DPS";
import {Requests} from "./services/Requests";

export class Manager {

    public ResourceGroup?: ResourceGroup;

    public IoTHub?: IoTHub;

    public DPS?: DPS;

    constructor(config: ClientConfig) {
            const requests = new Requests(config);
            const authenticator = new ClientAuthenticator(requests);
            this.ResourceGroup = new ResourceGroup(config.subscriptionId, authenticator, requests);
            this.IoTHub = new IoTHub(config.subscriptionId, authenticator, requests);
            this.DPS = new DPS(config.subscriptionId, authenticator, requests);
    }
}