# Generate mock applications and claims

## post-application

Generates a fake application and posts it to `/api/application/processer`

Outputs the application and server response to the console.

### Example usage
```sh
node test/scripts/post-application.mjs
```

### Example application
```js
{
  confirmCheckDetails: 'true',
  reference: 'IAHW-M8C4-1GS5',
  declaration: 'true',
  offerStatus: 'accepted',
  type: 'EE',
  organisation: {
    farmerName: 'Javon Greenholt-Hessel',
    name: 'Reilly - Stokes',
    crn: '5405363530',
    frn: '9030480247',
    sbi: '241372635',
    address: 'Ward-upon-Legros, PZ1 8CX, United Kingdom',
    email: 'javon.greenholt-hessel@yahoo.com',
    orgEmail: 'ignacio_lakin20@reillystokes.info',
    userType: 'newUser'
  }
}
```

### Example response
```js
200 OK
{
  applicationState: 'submitted',
  applicationReference: 'IAHW-M8C4-1GS5'
}
```
## Post claim

Generates a claim for a given application.

### Arguments

| property             | Possible values                                          | required |
| -------------------- |:--------------------------------------------------------:|---------:|
| applicationReference | any existing application reference e.g. 'IAHW-M8C4-1GS5' | true     |
| species              | beef, dairy, pigs or sheep                               | optional |
| claimType            | R (review) or E (followup)                               | optional |

### Example usage
```sh
node test/scripts/post-claim.mjs IAHW-M8C4-1GS5 beef R
```

### Example claim
```js
{
  applicationReference: 'IAHW-M8C4-1GS5',
  reference: 'TEMP-CLAIM-LVQX-5233',
  type: 'R',
  createdBy: 'admin',
  data: {
    typeOfLivestock: 'beef',
    dateOfVisit: '2025-02-03T12:01:24.560Z',
    speciesNumbers: 'yes',
    vetsName: 'Thomas Dare',
    vetRCVSNumber: '6772937',
    laboratoryURN: '01JK5TZM2FTK81ETDCYSJ4TQVR',
    dateOfTesting: '2025-02-03T12:01:24.559Z',
    testResults: 'negative',
    numberAnimalsTested: '99'
  }
}
```

### Example response
```js
200 OK
{
  id: '514660c7-e92e-40f0-b1b0-6ad68f5db7d8',
  updatedBy: null,
  applicationReference: 'IAHW-M8C4-1GS5',
  reference: 'REBC-LVQX-5233',
  type: 'R',
  createdBy: 'admin',
  data: {
    amount: 522,
    vetsName: 'Thomas Dare',
    claimType: 'R',
    dateOfVisit: '2025-02-03T12:01:24.560Z',
    testResults: 'negative',
    dateOfTesting: '2025-02-03T12:01:24.559Z',
    laboratoryURN: '01JK5TZM2FTK81ETDCYSJ4TQVR',
    vetRCVSNumber: '6772937',
    speciesNumbers: 'yes',
    typeOfLivestock: 'beef',
    numberAnimalsTested: '99'
  },
  statusId: 11,
  updatedAt: '2025-02-03T12:01:24.954Z',
  createdAt: '2025-02-03T12:01:24.954Z'
}
```
