module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: "8545",
      network_id: "*" // match any id
    },
    sepolia: {
      provider: () => new HDWalletProvider({
      mnemonic: {
      phrase: "<YOUR-MNEMONIC-PHRASE>"
      },
      providerOrUrl: "https://sepolia.infura.io/v3/<YOUR-INFURA-PROJECT-ID>"
      }),
      network_id: 10001, // Sepolia's network ID
      gas: 4000000, // Adjust the gas limit as per your requirements
      gasPrice: 10000000000, // Set the gas price to an appropriate value
      confirmations: 2, // Set the number of confirmations needed for a transaction
      timeoutBlocks: 200, // Set the timeout for transactions
      skipDryRun: true // Skip the dry run option
     }
  }
};