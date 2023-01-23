import {expect} from "chai";
import SafeAbi from "./abi/Safe.json"
import {deployments, ethers, network} from "hardhat";
import {ERC20, IGnosisSafe, SafeTokensModule} from "../typechain-types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

describe("SafeTokensModule", function () {
  let safeToken: ERC20;
  let safe: IGnosisSafe;
  let signer: SignerWithAddress;
  let badSigner: SignerWithAddress;
  let safeTokensModule: SafeTokensModule


  const SAFE_ADDRESS = "0xf0439Cf68309E8E21D8ccAF6A7d9D2b20180Ab5d";
  const SAFE_TOKEN_ADDRESS = "0x780b40978E0a467b94bd394Ee693616088E22372";
  const SAFE_TOKENS_MODULE_ADDRESS = "0x0cddf897819F4EC7EA0474126ad8b4C30a08372c";

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    [signer, badSigner] = (await ethers.getSigners());
    safe = await ethers.getContractAt(SafeAbi, SAFE_ADDRESS);
    safeToken = await ethers.getContractAt("ERC20", SAFE_TOKEN_ADDRESS)
    safeTokensModule = await ethers.getContractAt('SafeTokensModule', SAFE_TOKENS_MODULE_ADDRESS);
    const to = signer.address, amount = 14_000_000, nonce = 50;

    await deployments.fixture();
    return {
      safe, safeToken, safeTokensModule, to, amount, nonce
    }
  })

  describe("generateHash",  function() {
    it("should correctly generate a hash", async function() {
      const { to, amount, nonce, safeTokensModule  } = await setupTests()
      const expectedHash = ethers.utils.solidityKeccak256(["address", "uint", "uint"], [to, amount, nonce]);
      const actualHash =  await safeTokensModule.generateHash(amount, to, nonce)
      expect(actualHash).to.equal(expectedHash);
    });
  })

  describe("verifySignature",  () => {
    it("should correctly verify a signature", async function() {
      const { to, amount, nonce, safeTokensModule  } = await setupTests()
      const hash =  await safeTokensModule.generateHash(amount, to, nonce)
      const signature = await signer.signMessage(ethers.utils.arrayify(hash))
      const verified = await safeTokensModule.verifySignature(
        signer.address,
        to,
        amount,
        nonce,
        signature
      );

      expect(verified).to.equal(true);
    });

    it("should fail to verify signature if signer is not correct", async function() {
      const { to, amount, nonce, safeTokensModule  } = await setupTests()
      const hash =  await safeTokensModule.generateHash(amount, to, nonce)
      const signature = await signer.signMessage(ethers.utils.arrayify(hash))
      const verified = await safeTokensModule.verifySignature(
        badSigner.address,
        to,
        amount,
        nonce,
        signature
      );

      expect(verified).to.equal(false);
    });
  })

  describe("addWithdrawInfo", async function() {
    it("should fail to add withdraw info from unauthorized user", async function() {
      const { to, amount, nonce, safeTokensModule  } = await setupTests()
      const hash =  await safeTokensModule.generateHash(amount, to, nonce)
      const signature = await signer.signMessage(ethers.utils.arrayify(hash))
      await expect(safeTokensModule.connect(badSigner).addWithdrawInfo(to, amount, nonce, signature))
        .to.revertedWith("Unauthorized");
    });

    it("should emit an event when a new withdraw info is added", async function() {
      const { to, amount, nonce, safeTokensModule  } = await setupTests()
      const hash =  await safeTokensModule.generateHash(amount, to, nonce)
      const signature = await signer.signMessage(ethers.utils.arrayify(hash))
      await expect(safeTokensModule.addWithdrawInfo(to, amount, nonce, signature))
        .to.emit(safeTokensModule, "WithdrawInfoAdded")
        .withArgs(to, amount, signature);
    });
  })

  describe("withdrawTokens", function () {
    it("should fail when a user tries to reuse a signature", async function() {
      const { to, amount, nonce, safeTokensModule  } = await setupTests()
      const hash = await safeTokensModule.generateHash(amount, to, nonce)
      const signature = await signer.signMessage(ethers.utils.arrayify(hash))

      await safeTokensModule.addWithdrawInfo(to, amount, nonce, signature)
      await safeTokensModule.withdrawTokens(amount, to, signature)
      await expect(safeTokensModule.withdrawTokens(amount, to, signature))
        .to.revertedWith("Cannot reuse signature");
    });

    it("should fail when signature expires", async function() {
      const { to, amount, nonce, safeTokensModule  } = await setupTests()
      const hash = await safeTokensModule.generateHash(amount, to, nonce)
      const signature = await signer.signMessage(ethers.utils.arrayify(hash))

      await safeTokensModule.addWithdrawInfo(to, amount, nonce, signature)
      await network.provider.send("evm_increaseTime", [3600])
      await network.provider.send("evm_mine")
      await expect(safeTokensModule.withdrawTokens(amount, to, signature))
        .to.revertedWith("Expired signature");
    });

    it("should fail when a bad signature is used", async function() {
      const { to, amount, nonce, safeTokensModule  } = await setupTests()
      const hash = await safeTokensModule.generateHash(amount, to, nonce)
      const signature = await badSigner.signMessage(ethers.utils.arrayify(hash))
      await safeTokensModule.addWithdrawInfo(to, amount, nonce, signature)

      await expect(safeTokensModule.withdrawTokens(amount, to, signature))
        .to.revertedWith("Cannot verify signature");
    });

    it("should fail when a wrong amount is passed to withdrawTokens function", async function() {
      const { to, amount, nonce, safeTokensModule  } = await setupTests()
      const hash = await safeTokensModule.generateHash(amount, to, nonce)
      const signature = await signer.signMessage(ethers.utils.arrayify(hash))
      await safeTokensModule.addWithdrawInfo(to, amount, nonce, signature)

      const wrongAmount = 50_000_000;
      await expect(safeTokensModule.withdrawTokens(wrongAmount, to, signature))
        .to.revertedWith("Cannot verify signature");
    });

    it("Should successfully withdraw tokens to beneficiary", async function () {
      const { to, amount, nonce, safe, safeTokensModule  } = await setupTests()
      const hash = await safeTokensModule.generateHash(amount, to, nonce)
      const signature = await signer.signMessage(ethers.utils.arrayify(hash))
      await safeTokensModule.addWithdrawInfo(to, amount, nonce, signature)

      const balanceBefore =  await safeToken.balanceOf(to)
      const safeBalanceBefore =  await safeToken.balanceOf(safe.address);
      await safeTokensModule.withdrawTokens(amount, to, signature)

      const balanceAfter =  await safeToken.balanceOf(to)
      const safeBalanceAfter =  await safeToken.balanceOf(safe.address);

      expect(balanceAfter.sub(balanceBefore)).to.equal(amount);
      expect(safeBalanceBefore.sub(safeBalanceAfter)).to.equal(amount);
    });

    it("should emit an event when a new withdraw is completed", async function() {
      const { to, amount, nonce, safeTokensModule  } = await setupTests()
      const hash = await safeTokensModule.generateHash(amount, to, nonce)
      const signature = await signer.signMessage(ethers.utils.arrayify(hash))
      await safeTokensModule.addWithdrawInfo(to, amount, nonce, signature)
      await expect(safeTokensModule.withdrawTokens(amount, to, signature))
        .to.emit(safeTokensModule, "WithdrawTokens")
        .withArgs(to, amount, signature)
    });
  });
});
