export class Response {

    public success: boolean;

    public message: string;

    public error?: Error;

    constructor(success: boolean, message: string, error?: Error) {
        this.success = success;
        this.message = message;
        this.error = error;
    }
}