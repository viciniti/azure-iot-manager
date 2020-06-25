import {Authenticator} from "../interfaces/Authenticator";

export class IoTHub {

    readonly subscriptionId: string;

    readonly auth: Authenticator;

    private isMirrored: boolean;

    public name : string | undefined;

    constructor(subscriptionId: string, auth: Authenticator, name?: string, isMirrored?: boolean) {
        this.subscriptionId = subscriptionId;
        this.auth = auth;
        this.name = name;
        this.isMirrored = isMirrored || false;
    }



}