import {Response} from "./Response";
import {AuthenticationError} from "../errors/auth/AuthenticationError";

export class AuthResponse extends Response {

    public token: string | null;

    public expiresInSeconds: number | null;

    constructor(token: string | null, expiresInSeconds: number | null, error?: AuthenticationError) {
        if (!error) {
            super(true, "Successfully received token");
        } else {
            super(false, "Failed to authenticate", error);
        }

        this.token = token;
        this.expiresInSeconds = expiresInSeconds;
    }

}