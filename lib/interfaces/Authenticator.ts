import {Token} from "../entities/Token";
import {Requests} from "../services/Requests";

export interface Authenticator {
    requests: Requests;
    getToken: () => Promise<Token>
    getTokenCached: () => Promise<string|undefined>
}