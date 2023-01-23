pragma solidity ^0.8.17;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {

    constructor(uint256 initialSupply) ERC20("Test SafeToken", "tSAFE") public {
        _mint(msg.sender, initialSupply);
    }
    function decimals() public view override returns (uint8) {
        return 6;
    }
}
