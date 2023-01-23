// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "./BaseModule.sol";
import "./libraries/SignatureBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/// @title SafeTokensModule
/// @dev A simple Module allowing anyone with a valid signature to withdraw allocated tokens to their accounts
/// @author Mayowa Tudodnu <github: @mayorcoded>
contract SafeTokensModule is BaseModule {
    string public override VERSION = "1.0.0";
    string public override NAME = "SafeTokens Module";
    uint256 public constant SIGNATURE_EXPIRY_DURATION = 600; //10Mins

    struct WithdrawInfo {
        address beneficiary;
        uint256 amount;
        uint256 nonce ;
        bytes signature;
        uint256 signatureExpiration;
    }

    IERC20 public token;
    IGnosisSafe public safe;

    uint256 public nonce;
    address public moduleOwner;
    mapping(address => WithdrawInfo) public withdrawInfo;
    mapping(bytes => bool) public signatureUsed;

    modifier onlyModuleOwner(){
        require(msg.sender == moduleOwner, "Unauthorized");
        _;
    }

    event WithdrawInfoAdded(
        address indexed beneficiary,
        uint256 indexed amount,
        bytes indexed signature
    );

    event WithdrawTokens(
        address indexed beneficiary,
        uint256 indexed amount,
        bytes indexed signature
    );

    constructor(address _safe, address _token) {
        moduleOwner = msg.sender;
        token = IERC20(_token);
        safe = IGnosisSafe(_safe);
    }

    /// @dev Returns hash of a message that can be signed by the module owner
    /// @param amount Amount of tokens to send to the beneficiary
    /// @param beneficiary The recipient of the tokens
    /// @param nonce A number that increases the randomness of the hash
    function generateHash(uint256 amount, address beneficiary, uint256 nonce)
    external
    view
    returns(bytes32) {
        return SignatureBase.getMessageHash(beneficiary, amount, nonce);
    }

    /// @dev Verifies a signature sent by anyone
    ///      It checks that the singer of the signature matches the signer in the param and the module owner
    /// @param signer The address of the signer
    /// @param to The recipient of the tokens
    /// @param amount Amount of tokens to send to the beneficiary
    /// @param nonce A number that increases the randomness of the hash
    /// @param signature The signature to be verified
    function verifySignature(
        address signer,
        address to,
        uint amount,
        uint nonce,
        bytes memory signature
    ) public view returns(bool) {
        return SignatureBase.verify(signer, to, amount, nonce, signature);
    }

    /// @dev Stores withdraw information of a beneficiary to the contract
    /// @param beneficiary The recipient of the tokens
    /// @param amount Amount of tokens to send to the beneficiary
    /// @param nonce A number that increases the randomness of the hash
    /// @param signature The signature attached to the withdraw info
    function addWithdrawInfo(
        address beneficiary,
        uint256 amount,
        uint256 nonce ,
        bytes memory signature
    ) onlyModuleOwner external {
        uint256 signatureExpiration = block.timestamp + SIGNATURE_EXPIRY_DURATION;
        withdrawInfo[beneficiary] = WithdrawInfo(
            beneficiary,
            amount,
            nonce,
            signature,
            signatureExpiration
        );
        emit WithdrawInfoAdded(beneficiary, amount, signature);
    }

    /// @dev Withdraws tokens from Safe to beneficiary account
    /// @param amount Amount of tokens to send to the beneficiary
    /// @param beneficiary The recipient of the tokens
    /// @param signature The signature attached to the withdraw info of the beneficiary
    function withdrawTokens(
        uint256 amount,
        address beneficiary,
        bytes calldata signature
    ) external {
        WithdrawInfo memory withdrawInfo = withdrawInfo[beneficiary];
        require(!signatureUsed[signature], "Cannot reuse signature");
        require(block.timestamp <= withdrawInfo.signatureExpiration, "Expired signature");
        require(verifySignature(
            moduleOwner,
            beneficiary,
            amount,
            withdrawInfo.nonce,
            signature
        ), "Cannot verify signature");

        signatureUsed[signature] = true;
        transfer(safe, beneficiary, address(token), amount);
        emit WithdrawTokens(beneficiary, amount, signature);
    }

    /// @dev Returns the withdraw info for a beneficiary
    /// @param beneficiary The beneficiary of the withdraw info
    function getWithdrawInfo(address beneficiary) view public returns(WithdrawInfo memory) {
        return withdrawInfo[beneficiary];
    }
}
