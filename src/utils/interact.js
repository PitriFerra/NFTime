import {pinJSONToIPFS} from './pinata.js'
import Web3 from 'web3';

require('dotenv').config();
const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY;
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(alchemyKey); 
const contractABI = require('../contract-abi.json')
const contractAddress = "0x09c0d1Fe0d8237c9A17da5E10818CcdA76ee44f5";
const web33 = new Web3(window.ethereum); // Create a new instance of web3
const contract = new web33.eth.Contract(contractABI, contractAddress); // Create a contract instance using the contract address and ABI

export const mintToken = async (recipient, watch) => {
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

  try {
    // Get the account to send the transaction from
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const sender = accounts[0];

    // Call the safeMint function with the fee included
    await contract.methods.safeMint(recipient, tokenURI).send({
      from: sender,
      value: 10
    });

    return {
      success: true,
      status: "✅ Something went right"
    }
  } catch (error) {
    return {
      success: false,
      status: "😥 Something went wrong: " + error.message
    }
  }
};

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
      value: 10, // Fee in wei
      'data': window.contract.methods.safeMint(recipient, tokenURI).encodeABI() // make call to NFT smart contract 
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

export const isRole = async (role) => {
  try{
    return await contract.methods.hasRole(role, window.ethereum.selectedAddress).call(); // Call the smart contract function
  } catch (error) {
    console.error("Error retrieving role validity:", error);
    return false;
  }
}

export const pause = async () => {
  try{
    return await contract.methods.pause().send({ from: window.ethereum.selectedAddress }); // Call the smart contract function
  } catch (error) {
    console.error("Error retrieving role validity:", error);
    return false;
  }
}

export const unpause = async () => {
  try{
    return await contract.methods.unpause().send({ from: window.ethereum.selectedAddress }); // Call the smart contract function
  } catch (error) {
    console.error("Error retrieving role validity:", error);
    return false;
  }
}

export const grantMINTER_RoleFunction = async (recipient) => {
  try{
    await contract.methods.grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", recipient).send({ from: window.ethereum.selectedAddress }); // Call the smart contract function
    return "Role MINTER granted successfully to " + recipient;
  } catch (error) {
    console.error("Couldn't grant MINTER role to " + recipient + ":", error);
    return "Couldn't grant MINTER role to " + recipient;
  }
}

export const revokeMINTER_RoleFunction = async (recipient) => {
  try{
    await contract.methods.revokeRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", recipient).send({ from: window.ethereum.selectedAddress }); // Call the smart contract function
    return "Role MINTER revoked successfully to " + recipient;
  } catch (error) {
    console.error("Couldn't revoke MINTER role to " + recipient + ":", error);
    return "Couldn't revoke MINTER role to " + recipient;
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