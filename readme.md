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
### Creating IoT Hub from resource group instance

```
const iotHub = await resourceGroup.createIoTHub(LocationCode.West_Europe, 1, TierCode.S1, 'testHub');
```

If you have already existing resource, do the following:

```
const dps = iotManager.DPS.initExisting('testDPS', 'testResourceGroup','testHub');
```

### Using connection strings

Before doing some operation that requires connection string usage, please, make sure to call `generateConnectionString()` function on the instance to make sure
that the string is generated(this is done, because it takes time for some resources to be in active state and calling this method from factory won't be good option).

### Example

```
const iotHub = iotManager.IoTHub.initExisting('testHub', 'testResourceGroup');

await iotHub.generateConnectionString();

const dps = await iotHub.createDPS(LocationCode.West_Europe, TierCode.S1, 1, 'testDPS')
```


