export class Config {

    public tenantId: string

    public clientId: string

    public clientSecret: string

    constructor(tenantId: string, clientId: string, clientSecret: string) {
        this.tenantId = tenantId;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

}