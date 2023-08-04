var FidesToken = artifacts.require("./FidesToken.sol");

module.exports = function(deployer) {
  deployer.deploy(FidesToken);
};