export class ResourceGroupError extends Error {

    public description: string;

    public code: number;

    constructor(code: number,m: string, description: string) {
        super(m);
        this.description = description;
        this.code = code;
        Object.setPrototypeOf(this, ResourceGroupError.prototype);
    }
    printStack() {
        return "Resource group error: " + this.message;
    }
}