import {Config} from "../entities/Config";
import {Token} from "../entities/Token";

export interface Authenticator {
    config: Config
    getToken: () => Promise<Token>
    getTokenCached: () => Promise<string|undefined>
}