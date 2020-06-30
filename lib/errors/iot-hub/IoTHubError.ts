export class IoTHubError extends Error {

    public resourceGroupName?: string;

    public description: string

    constructor(public code: number,m: string, description: string, resourceGroupName?: string) {
        super(m);
        this.description = description;
        this.resourceGroupName = resourceGroupName;
        Object.setPrototypeOf(this, IoTHubError.prototype);
    }
    printStack() {
        return "IoTHub error: " + this.message;
    }
}