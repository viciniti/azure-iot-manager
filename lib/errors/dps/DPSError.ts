export class DPSError extends Error {
    public description: string;

    public code: number;

    constructor(code: number,m: string, description: string, name: string, resourceGroupName?: string, iotHubName?: string) {
        super(m);
        this.code = code;
        this.description = description;
        Object.setPrototypeOf(this, DPSError.prototype);
    }

    printStack() {
        return "DPS error: " + this.message;
    }
}