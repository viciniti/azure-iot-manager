export class DPSError extends Error {
    constructor(public code: number,m: string, resourceGroupName?: string) {
        super(m);
        Object.setPrototypeOf(this, DPSError.prototype);
    }
    printStack() {
        return "DPS error: " + this.message;
    }
}