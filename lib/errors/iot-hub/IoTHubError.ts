export class IoTHubError extends Error {
    constructor(public code: number,m: string, resourceGroupName?: string) {
        super(m);
        Object.setPrototypeOf(this, IoTHubError.prototype);
    }
    printStack() {
        return "IoTHub error: " + this.message;
    }
}