export class Config {

    public clientId: string

    public subscriptionId: string

    constructor(clientId: string, subscriptionId: string) {
        this.clientId = clientId;
        this.subscriptionId = subscriptionId;
    }

}