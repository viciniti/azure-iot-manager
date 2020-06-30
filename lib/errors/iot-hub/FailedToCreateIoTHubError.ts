import {IoTHubError} from "./IoTHubError";

export class FailedToCreateIoTHubError extends IoTHubError {
    constructor(public code: number,m: string, description: string, resourceGroupName?: string) {
        super(code, m, description, resourceGroupName);
        Object.setPrototypeOf(this, FailedToCreateIoTHubError.prototype);
    }
    printStack() {
        return "IoT Hub error: " + this.message;
    }
}