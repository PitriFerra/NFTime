import {pinJSONToIPFS} from './pinata.js'
import Web3 from 'web3';

require('dotenv').config();
const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY;
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(alchemyKey); 
const contractABI = require('../contract-abi.json')
const contractAddress = "0x7a360028e625E1f623Dec86f9E00B07685079aE7";
const web33 = new Web3(window.ethereum); // Create a new instance of web3
const contract = new web33.eth.Contract(contractABI, contractAddress); // Create a contract instance using the contract address and ABI

export const mintNFT = async(recipient, watch) => {
    // error handling --------------------------------------------------------
    if(recipient.trim() === "")
      return {
        success: false,
        status: "❗Please make sure all fields are completed before minting."
      }
    // -----------------------------------------------------------------------

    // make metadata ---------------------------------------
    const metadata = {};
    metadata.name = watch.model;
    metadata.image = watch.image;
    metadata.description = watch.description;
    metadata.attributes = [
      ...watch.colors.map((color) => ({
        trait_type: "colors",
        value: color,
      })),
      {
        trait_type: "year_of_production",
        value: watch.year_of_production,
      },
      {
        trait_type: "certifier",
        value: window.ethereum.selectedAddress,
      },
      {
        trait_type: "brand",
        value: watch.brand,
      }
    ];
    // -----------------------------------------------------
    
    const pinataResponse = await pinJSONToIPFS(metadata); // pinata pin request

    if (!pinataResponse.success)
      return {
        success: false,
        status: "😢 Something went wrong while uploading your tokenURI.",
      }
    
    const tokenURI = pinataResponse.pinataUrl;  
    window.contract = await new web3.eth.Contract(contractABI, contractAddress); // load smart contract

    // set up your Ethereum transaction
    const transactionParameters = {
      to: contractAddress, // Required except during contract publications.
      from: window.ethereum.selectedAddress, // must match user's active address.
      'data': window.contract.methods.mint(recipient, tokenURI).encodeABI() // make call to NFT smart contract 
    };

    // Sign transaction via Metamask ---------------------------------------------------------------------
    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
      return {
        success: true,
        status: "✅ Check out your transaction on Etherscan: https://mumbai.polygonscan.com/tx/" + txHash
      }
    } catch (error) {
      return {
        success: false,
        status: "😥 Something went wrong: " + error.message
      }
    }
    // ---------------------------------------------------------------------------------------------------
}

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const obj = {
        status: "👆🏽 Write a message in the text-field above.",
        address: addressArray[0],
      };
      return obj;
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            <a rel="noreferrer" target="_blank" href={`https://metamask.io/download.html`}>
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.
            </a>
          </p>
        </span>
      ),
    };
  }
};

export const getCurrentWalletConnected = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (addressArray.length > 0) {
        return {
          address: addressArray[0],
          status: "Welcome to NFTime",
        };
      } else {
        return {
          address: "",
          status: "🦊 Connect to Metamask using the top right button.",
        };
      }
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else
    return installEthereum();
};

export const isMinter = async () => {
  try{
    const result = await contract.methods.hasRole(0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6, window.ethereum.selectedAddress).call(); // Call the smart contract function

    if(result)
      return {
        result: result,
        status: "Welcome to NFTime",
      };
    else
      return {
        result: result,
        status: "You are not a minter",
      };
  } catch (error) {
    console.error("Error retrieving minter validity:", error);
    return false;
  }
}

export const getBrandValidity = async () => {
  try {
    const result = await contract.methods.getBrandValidity(window.ethereum.selectedAddress).call(); // Call the smart contract function

    if(result)
      return {
        result: result,
        status: "Welcome to NFTime",
      };
    else
      return {
        result: result,
        status: "😥 You're not a brand or your validity has been revoked. Contact your brand for more details",
      };
  } catch (error) {
    console.error("Error retrieving brand validity:", error);
    return false;
  }
}

export const getOwnedNFTs = async () => {
  try {
    const walletAddress = window.ethereum.selectedAddress; // Get the connected wallet's address
    const ownedNFTs = await contract.methods.getOwnedNFTs(walletAddress).call(); // Call the smart contract function to get the NFTs owned by the wallet
    return ownedNFTs;
  } catch (error) {
    console.error("Error retrieving owned NFTs:", error);
    return [];
  }
};

function installEthereum() {
  return {
    address: "",
    status: (
      <span>
        <p>
          {" "}
          🦊{" "}
          <a rel="noreferrer" target="_blank" href={`https://metamask.io/download.html`}>
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.
          </a>
        </p>
      </span>
    ),
  };
}

export const onSellNFT = async (watch, price) => {
  // TODO: implement logic in the smart contract and then here
}