import {Response} from "./Response";
import {AuthenticationError} from "../errors/auth/AuthenticationError";
import {Token} from "../types/Token";

export class AuthResponse extends Response {

    public token: Token | undefined;

    constructor(token: Token | undefined, error?: AuthenticationError) {
        if (!error) {
            super(true, "Successfully received token");
        } else {
            super(false, "Failed to authenticate", error);
        }

        this.token = token;
    }

}