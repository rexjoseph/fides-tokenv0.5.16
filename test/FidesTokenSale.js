var FidesToken = artifacts.require("./FidesToken.sol");
var FidesTokenSale = artifacts.require("./FidesTokenSale.sol");

contract('FidesTokenSale', (accounts) => {
  var tokenInstance;
  var tokenSaleInstance;

  var admin = accounts[0];
  var buyer = accounts[1];
  var tokenPrice = 1000000000000000; // wei
  var numberOfTokens;
  var tokensAvailable = 8000000;

  it('initializes the contract with correct values', () => {
    return FidesTokenSale.deployed().then((instance) => {
      tokenSaleInstance = instance;
      return tokenSaleInstance.address;
    }).then((address) => {
      assert.notEqual(address, 0x0, 'has contract address');
      return tokenSaleInstance.tokenContract();
    }).then((address) => {
      assert.notEqual(address, 0x0, 'has token contract address');
      return tokenSaleInstance.tokenPrice();
    }).then((price) => {
      assert.equal(price, tokenPrice, 'token price is correct');
    })
  });

  it('facilitates token buying', () => {
    return FidesToken.deployed().then((instance) => {
      // get token instance first
      tokenInstance = instance;
      return FidesTokenSale.deployed();
    }).then((instance) => {
      // now get token sale instance
      tokenSaleInstance = instance;
      // provision some tokens (40%) to token sale
      return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });
    }).then((receipt) => {
      numberOfTokens = 10;
      return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
    }).then((receipt) => {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
      assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
      assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
      return tokenSaleInstance.tokensSold();
    }).then((amount) => {
      assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
      return tokenInstance.balanceOf(buyer);
    }).then((balance) => {
      assert.equal(balance.toNumber(), numberOfTokens);
      return tokenInstance.balanceOf(tokenSaleInstance.address);
    }).then((balance) => {
      assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
      // attempt buying tokens different from the ether value
      return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
    }).then(assert.fail).catch((err) => {
      assert(err.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
      return tokenSaleInstance.buyTokens(9000000, { from: buyer, value: numberOfTokens * tokenPrice });
    }).then(assert.fail).catch((err) => {
      assert(err.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available');
    });
  });

  it('ends the token sale', () => {
    return FidesToken.deployed().then((instance) => {
      // get token instance first
      tokenInstance = instance;
      return FidesTokenSale.deployed();
    }).then((instance) => {
      // now get token sale instance
      tokenSaleInstance = instance;
      // try ending sale on an account other than admin
      return tokenSaleInstance.endSale({ from: buyer });
    }).then(assert.fail).catch((err) => {
      assert(err.message.indexOf('revert') >= 0, 'must be an admin to end sale');
      // end sale as admin
      return tokenSaleInstance.endSale({ from: admin });
    }).then((receipt) => {
      return tokenInstance.balanceOf(admin);
    }).then((balance) => {
      assert.equal(balance.toNumber(), 14000000, 'returns all unsold tokens to admin');
      // assert.equal(balance.toNumber(), 99999990, 'returns all unsold tokens to admin');
      return web3.eth.getBalance(tokenSaleInstance.address);
    }).then((balance) => {
      const balanceInWei = parseInt(balance);
      assert.equal(balanceInWei, 0, 'ether balance of contract should be 0');
    })
  });
})