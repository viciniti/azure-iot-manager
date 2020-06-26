export class DPSError extends Error {
    constructor(public code: number,m: string, name: string, resourceGroupName?: string, iotHubName?: string) {
        super(m);
        Object.setPrototypeOf(this, DPSError.prototype);
    }
    printStack() {
        return "DPS error: " + this.message;
    }
}