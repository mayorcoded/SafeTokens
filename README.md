# SafeTokens Module

## Summary
This project is a sample Safe Module that allows anyone with a valid signature from the Safe owner to withdraw a
pre-allocated token amount to a beneficiary address. The signature is generated offline using the ECDSA scheme and verified
in the module. A withdrawal from the safe to the beneficiary is completed if the signature is valid and not expired. 

The Safe was created via the web interface, and the SafeModule was enabled via the transaction builder on the web 
interface as well. 

### Usage

#### Installation
```shell
yarn
```

#### Run tests
```shell
npx hardhat test
```

#### Deploy
```shell
npx hardhat deploy --network goerli --tags 
```
