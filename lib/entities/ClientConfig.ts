import {Config} from "./Config";

export class ClientConfig extends Config {

    public tenantId: string

    public clientSecret: string

    constructor(clientId: string, subscriptionId: string, tenantId: string, clientSecret: string) {
        super(clientId, subscriptionId);
        this.tenantId = tenantId;
        this.clientSecret = clientSecret;
    }

}