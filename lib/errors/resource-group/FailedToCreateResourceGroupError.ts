import {ResourceGroupError} from "./ResourceGroupError";

export class FailedToCreateResourceGroupError extends ResourceGroupError {

    constructor(code: number, m: string, description: string) {
        super(code,m,description);
        this.description = description;
        this.code = code;
        Object.setPrototypeOf(this, ResourceGroupError.prototype);
    }
}