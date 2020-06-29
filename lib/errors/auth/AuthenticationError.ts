export class AuthenticationError extends Error {

    public description: string;

    public code: number;

    constructor(code: number,m: string, description: string) {
        super(m);
        this.code = code;
        this.description = description;
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }

    printStack() {
        return "Authentication error: " + this.message;
    }
}