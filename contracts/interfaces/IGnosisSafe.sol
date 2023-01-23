// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IGnosisSafe {
    enum Operation {
        CALL,
        DELEGATECALL
    }

    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        Operation operation
    ) external returns (bool);

    function execTransactionFromModuleReturnData(
        address to,
        uint256 value,
        bytes memory data,
        Operation operation
    ) external returns (bool, bytes memory);
}
