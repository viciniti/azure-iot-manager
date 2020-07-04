# Azure IoT manager
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Installing
``npm install azure-iot-manager``
# Usage

### Import

ES6

``import * as azureIoTManager from 'azure-iot-manager';``

ES5

``const azureIoTManager = require('azure-iot-manager');``

#

### Example

Instantiating manager instance

``const iotManager = azureIoTManager.init({ clientId: '***', subscriptionId: '***', tenantId: '***', clientSecret: '***' })``

### Creating resource group
```
import * as azureIoTManager from 'azure-iot-manager';
import {LocationCode} from "azure-iot-manager/lib/enums/LocationCode";


const iotManager = azureIoTManager.init({ clientId: '***', subscriptionId: '***', tenantId: '***', clientSecret: '***' })

const resourceGroup = iotManager.ResourceGroup.init(LocationCode.West_Europe, 'testResourceGroup');
```


