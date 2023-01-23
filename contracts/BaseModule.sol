// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "./interfaces/IGnosisSafe.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title BaseModule
/// @author Mayowa Tudodnu <github: @mayorcoded>
abstract contract BaseModule {

    /// @dev Executes token transfer via the module to the Safe
    /// @param to The recipient of the tokens
    /// @param asset The token address
    /// @param amount Amount of tokens to transfer to the recipient
    function transfer(
        IGnosisSafe safe,
        address to,
        address asset,
        uint256 amount
    ) internal {
        bool success = safe.execTransactionFromModule(
            asset,
            0,
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount),
            IGnosisSafe.Operation.CALL
        );

        require(success, "failed to transfer");
    }

    /// @dev Executes token transfer on behalf of the Safe from another account into the Safe
    /// @param safe The address of the safe proxy
    /// @param from The address to transfer tokenns from
    /// @param asset The token address
    /// @param amount Amount of tokens to transfer to the recipient
    function transferFrom(
        IGnosisSafe safe,
        address from,
        address asset,
        uint256 amount
    ) internal {
        bool success = safe.execTransactionFromModule(
            asset,
            0,
            abi.encodeWithSelector(
                IERC20.transferFrom.selector,
                from,
                address(safe),
                amount
            ),
            IGnosisSafe.Operation.CALL
        );

        require(success, "failed to transfer");
    }

    function NAME() external view virtual returns (string memory);

    function VERSION() external view virtual returns (string memory);
}
