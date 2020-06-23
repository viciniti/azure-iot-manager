export class AuthenticationError extends Error {
    constructor(public code: number,m: string) {
        super(m);
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
    printStack() {
        return "Authentication error: " + this.message;
    }
}