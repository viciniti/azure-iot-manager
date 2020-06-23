import {ResourceGroupError} from "./ResourceGroupError";

export class FailedToCreateResourceGroupError extends ResourceGroupError {
    constructor(public code: number, m: string) {
        super(code,m);
        Object.setPrototypeOf(this, ResourceGroupError.prototype);
    }
}