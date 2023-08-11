App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false, // initial loading state
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 8000000,

  init: async function () {
    console.log("app initialized...");
    await App.initWeb3();
    await App.initContracts();
    App.setupEventListeners();
    await App.render();
  },

  initWeb3: function () {
    if (typeof web3 !== "undefined") {
      // web3 instance already provided by Metamask?
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // default if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:8545"
      );
      web3 = new Web3(App.web3Provider);
    }
    // let's call the app
    return App.initContracts();
  },

  initContracts: function () {
    return new Promise(function(resolve, reject) {
      $.getJSON("FidesTokenSale.json", function (fidesTokenSale) {
        App.contracts.FidesTokenSale = TruffleContract(fidesTokenSale);
        App.contracts.FidesTokenSale.setProvider(App.web3Provider);
        App.contracts.FidesTokenSale.deployed().then(function (fidesTokenSale) {
          console.log("Fides Token Sale Address:", fidesTokenSale.address);
        });
      }).done(function () {
        $.getJSON("FidesToken.json", function (fidesToken) {
          App.contracts.FidesToken = TruffleContract(fidesToken);
          App.contracts.FidesToken.setProvider(App.web3Provider);
          App.contracts.FidesToken.deployed().then(function (fidesToken) {
            console.log("Fides Token Address:", fidesToken.address);
          });
          // listen for events
          App.listenForEvents();
          return App.render();
        });
      });
    })
  },

  // listen for contract emitted events
  listenForEvents: function() {
    let events = []; // Array to store the events
  
    App.contracts.FidesTokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        if (error) {
          console.error("Error listening for events:", error);
        } else {
          console.log("event triggered", event);
  
          // Get the amount bought from the event
          let amountBought = event.args._amount.toNumber();
          let tokenBuyer = event.args._buyer.substring(0, 5) + "..." + event.args._buyer.substring(event.args._buyer.length - 4);

          /* const formattedAddress = account.substring(0, 5) + "..." + account.substring(account.length - 4);
        $('#accountAddress').html(formattedAddress); */
  
          // Create the event item container (flex-style <li>)
          let eventList = $('.event-list');
          let eventItem = document.createElement('li');
          eventItem.classList.add('event-item');

          let iconDiv = document.createElement('div');
          iconDiv.classList.add('iconDiv');
          eventItem.appendChild(iconDiv)
  
          // Create the icon element
          let icon = document.createElement('img');
          icon.src = '/images/eth-logo.png';
          icon.alt= 'logo';
          iconDiv.appendChild(icon);
  
          let contentContainer = document.createElement('div');
          contentContainer.classList.add('content-container');
  
          // Create the address paragraph
          let addressPara = document.createElement('p');
          addressPara.textContent = "Address: " + tokenBuyer;
          contentContainer.appendChild(addressPara);
  
          // Create the amount paragraph
          let amountPara = document.createElement('p');
          amountPara.classList.add("amountPara");
          amountPara.textContent = "purchased " + amountBought + " FIDES";
          contentContainer.appendChild(amountPara);
  
          // Add the content container to the event item
          eventItem.appendChild(contentContainer);
  
          events.unshift(eventItem); // Add the new event item to the beginning of the events array
  
          // Update the event list with the recent events (only show the first 5)
          eventList.empty(); // Clear the event list before adding the updated events
          let numEventsToShow = Math.min(events.length, 5);
          for (let i = 0; i < numEventsToShow; i++) {
            eventList.append(events[i]);
          }
  
          if (events.length > 5) {
            let showMoreLink = document.createElement('a');
            showMoreLink.href = '#'; // Add the link target if needed
            showMoreLink.textContent = 'Show More';
            showMoreLink.classList.add('show-more-link');
            eventList.append(showMoreLink);
          }
  
          App.render();
        }
      });
    });
  },
  

  // let's render something on the page
  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    let loader = $('#loader');
    let content = $('#content');

    loader.show();
    content.show();

    // get access to the connected account
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        console.log("account", account);
        App.account = account;
        const formattedAddress = account.substring(0, 5) + "..." + account.substring(account.length - 4);
        $('#accountAddress').html(formattedAddress);
        // $('#connectButton').hide(); // Hide the connect button when the account is connected
      } else {
        console.error("Error getting account:", err);
        App.account = '0x0';
        $('#accountAddress').html("Please connect your account using MetaMask.");
        // $('#connectButton').show(); // Show the connect button when the account is not connected
      }
    })

    App.contracts.FidesTokenSale.deployed().then(function(instance) {
      fidesTokenSaleInstance = instance;
      return fidesTokenSaleInstance.tokenPrice();
    }).then((tokenPrice) => {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
      return fidesTokenSaleInstance.tokensSold();
    }).then((tokensSold) => {
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      // push in token contract balance
      App.contracts.FidesToken.deployed().then((instance) => {
        fidesTokenInstance = instance;
        return fidesTokenInstance.balanceOf(App.account);
      }).then((balance) => {
        $('.fides-balance').html(balance.toNumber());  
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function() {
   $('#content').hide();
   $('#loader').show(); 
   let numberOfTokens = $('#numberOfTokens').val();
   App.contracts.FidesTokenSale.deployed().then(function(instance) {
    return instance.buyTokens(numberOfTokens, {
      from: App.account,
      value: numberOfTokens * App.tokenPrice,
      gas: 500000
    });
   }).then((result) => {
    console.log('Tokens bought...');
    $('form').trigger('reset') // reset token value in form
    // wait for Sell event
   }).catch(function(err) {
    console.error("Error buying tokens:", err);
    // Additional error handling or error message display
    $('#loader').hide(); // hide the loader in case of an error
    $('#content').show(); // show the content to try again or display an error message
   })
  },

  setupEventListeners: function() {
    // Set up an event listener for accountsChanged event
    ethereum.on('accountsChanged', function(accounts) {
      console.log("accountsChanged event triggered:", accounts);
      if (accounts.length > 0) {
        var account = accounts[0];
        console.log("Connected account:", account);
        App.account = account;
        const formattedAddress = account.substring(0, 5) + "..." + account.substring(account.length - 4);
        $('#accountAddress').html(formattedAddress);
        // $('#connectButton').hide(); // Hide the connect button after successful connection
      } else {
        console.log("No accounts found in MetaMask.");
        App.account = '0x0'; // Reset the account to default
        $('#accountAddress').html("Please connect your account using MetaMask.");
        // $('#connectButton').show(); // Show the connect button when the account is not connected
      }
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();

    // Event listener for the connect button
    $("#connectButton").on("click", function() {
      // Prompt the user to connect their MetaMask account
      ethereum.request({ method: "eth_requestAccounts" }).then(function(accounts) {
        var account = accounts[0];
        console.log("Connected account:", account);
        App.account = account;
        const formattedAddress = account.substring(0, 5) + "..." + account.substring(account.length - 4);
        $('#accountAddress').html(formattedAddress);
        $('#connectButton').hide(); // Hide the connect button after successful connection
      }).catch(function(error) {
        console.error("Error connecting account:", error);
      });
    });
  });
});
