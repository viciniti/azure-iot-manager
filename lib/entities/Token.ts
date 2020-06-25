export class Token {

    public accessToken: string

    public expiresOn: number

    constructor(accessToken: string, expiresOn: number) {
        this.accessToken = accessToken;
        this.expiresOn = expiresOn;
    }

}