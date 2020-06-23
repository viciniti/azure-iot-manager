export class ResourceGroupError extends Error {
    constructor(public code: number,m: string) {
        super(m);
        Object.setPrototypeOf(this, ResourceGroupError.prototype);
    }
    printStack() {
        return "Resource group error: " + this.message;
    }
}