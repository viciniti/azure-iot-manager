export class ResourceGroupError extends Error {
    constructor(public code: number,m: string) {
        super(m);
        Object.setPrototypeOf(this, ResourceGroupError.prototype);
    }
    printStack() {
        return "Resource group error: " + this.message;
    }
}

// tslint:disable-next-line:max-classes-per-file
export class FailedToCreateResourceGroupError extends ResourceGroupError {
    constructor(public code: number, m: string) {
        super(code,m);
        Object.setPrototypeOf(this, ResourceGroupError.prototype);
    }
}