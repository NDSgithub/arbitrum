/*
 * Copyright 2019, Offchain Labs, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ArbProtocol = artifacts.require("./ArbProtocol.sol");
var VM = artifacts.require("./VM.sol");
var ArbValue = artifacts.require("./ArbValue.sol");
var Disputable = artifacts.require("./Disputable.sol");
var Unanimous = artifacts.require("./Unanimous.sol");
var Bisection = artifacts.require("./Bisection.sol");
var VMTracker = artifacts.require("./VMTracker.sol");
var OneStepProof = artifacts.require("./OneStepProof.sol");
var ArbMachine = artifacts.require("./ArbMachine.sol");
var BytesLib = artifacts.require("bytes/BytesLib.sol");
var MerkleLib = artifacts.require("./MerkleLib.sol");
var SigUtils = artifacts.require("./SigUtils.sol");
var ChallengeManager = artifacts.require("./ChallengeManager.sol");
var ArbBalanceTracker = artifacts.require("./ArbBalanceTracker.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(MerkleLib);
  deployer.link(MerkleLib, [Bisection, VMTracker, Unanimous]);

  deployer.deploy(SigUtils);
  deployer.link(SigUtils, [VMTracker, Unanimous]);

  deployer.deploy(BytesLib);
  deployer.link(BytesLib, [ArbValue]);

  deployer.deploy(ArbValue);
  deployer.link(ArbValue, [
    VMTracker,
    OneStepProof,
    ArbMachine,
    ArbProtocol,
    VM
  ]);

  deployer.deploy(ArbProtocol);
  deployer.link(ArbProtocol, [
    VMTracker,
    ChallengeManager,
    OneStepProof,
    VM,
    Disputable,
    Bisection
  ]);

  deployer.deploy(ArbMachine);
  deployer.link(ArbMachine, [OneStepProof]);

  deployer.deploy(OneStepProof);
  deployer.link(OneStepProof, ChallengeManager);

  deployer.deploy(Bisection);
  deployer.link(Bisection, ChallengeManager);

  deployer.deploy(VM);
  deployer.link(VM, [Disputable, Unanimous, VMTracker]);

  deployer.deploy(Disputable);
  deployer.link(Disputable, VMTracker);

  deployer.deploy(Unanimous);
  deployer.link(Unanimous, VMTracker);

  deployer
    .deploy(ArbBalanceTracker)
    .then(() => {
      return deployer.deploy(VMTracker, ArbBalanceTracker.address);
    })
    .then(() => {
      return deployer.deploy(ChallengeManager, VMTracker.address);
    })
    .then(() => {
      return ArbBalanceTracker.deployed();
    })
    .then(balanceTracker => {
      balanceTracker.transferOwnership(VMTracker.address);
      return VMTracker.deployed();
    })
    .then(vmTracker => {
      const fs = require("fs");
      let addresses = {
        ArbProtocol: ArbProtocol.address,
        ChallengeManager: ChallengeManager.address,
        OneStepProof: OneStepProof.address,
        vmTracker: vmTracker.address,
        balanceTracker: ArbBalanceTracker.address
      };
      fs.writeFileSync("bridge_eth_addresses.json", JSON.stringify(addresses));
      vmTracker.addChallengeManager(ChallengeManager.address);
    });
};
