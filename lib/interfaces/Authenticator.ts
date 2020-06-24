import {Config} from "../types/Config";
import {AuthResponse} from "../response-types/AuthResponse";

export interface Authenticator {
    config: Config
    getToken: () => Promise<AuthResponse>
    getTokenCached: () => Promise<string|undefined>
}