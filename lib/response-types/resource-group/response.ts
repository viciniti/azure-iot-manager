import {Response} from "../Response";
import {ResourceGroupError} from "../../errors/error";

export class CreateResourceGroupResponse extends Response {

    public resourceGroupName: string

    constructor(resourceGroupName: string, error?: ResourceGroupError) {
        if (!error) {
            super(true, "Successfully created resource group");
        } else {
            super(false, "Failed to create resource group", error);
        }
        this.resourceGroupName = resourceGroupName;
    }

}