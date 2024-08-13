import {pinJSONToIPFS} from './pinata.js'
import {Contract, ethers} from "ethers";

require('dotenv').config();

const contractABI = require('../contract-abi.json')
const contractAddress = "0xA99b2d726a2E2df3857b413699753eBa5EFb5c5f";

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
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    const tx = await contract.safeMint(recipient, tokenURI, 10);

    const receipt = await tx.wait();

    if (receipt.logs) {
      for (const log of receipt.logs) {
        try {
          const event = contract.interface.parseLog(log);
          if (event) {
            console.log("Event found:", event.name);
            console.log("Event arguments:", event.args);

            // If you're expecting a specific event, you can check for it here
            if (event.name === 'Transfer') {
              const tokenId = event.args.tokenId;
              console.log('Minted token ID:', tokenId.toString());
            }

            // If there's a custom event with the result, check for it here
            if (event.name === 'MintResult') {
              const result = event.args.result; // Adjust 'result' to match your event structure
              console.log('Mint result:', result.toString());
            }
          }
        } catch (parseError) {
          console.log("Couldn't parse log:", log);
          return {
            success: false,
            status: "😥 Something went wrong: " + parseError.message
          }
        }
      }
    }

    return {
      success: true,
      status: "✅ Something went right, result: " + receipt.transactionHash
    }
  } catch (error) {
    console.error("Error minting NFT:", error);
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
    // window.contract = await new web3.eth.Contract(contractABI, contractAddress); // load smart contract

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
    const provider = new ethers.BrowserProvider(window.ethereum)

    const contract = new ethers.Contract(contractAddress, contractABI, provider)
    return await contract.hasRole(role, window.ethereum.selectedAddress);
  } catch (error) {
    console.error("Error retrieving role validity:", error);
    return false;
  }
}

export const pause = async () => {
  try{
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    return await contract.pause();
  } catch (error) {
    console.error("Error retrieving role validity:", error);
    return false;
  }
}

export const unpause = async () => {
  try{
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    return await contract.unpause();
  } catch (error) {
    console.error("Error retrieving role validity:", error);
    return false;
  }
}

export const grantMINTER_RoleFunction = async (recipient) => {
  try{
    // await contract.methods.grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", recipient).send({ from: window.ethereum.selectedAddress }); // Call the smart contract function
    return "Role MINTER granted successfully to " + recipient;
  } catch (error) {
    console.error("Couldn't grant MINTER role to " + recipient + ":", error);
    return "Couldn't grant MINTER role to " + recipient;
  }
}

export const revokeMINTER_RoleFunction = async (recipient) => {
  try{
    // await contract.methods.revokeRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", recipient).send({ from: window.ethereum.selectedAddress }); // Call the smart contract function
    return "Role MINTER revoked successfully to " + recipient;
  } catch (error) {
    console.error("Couldn't revoke MINTER role to " + recipient + ":", error);
    return "Couldn't revoke MINTER role to " + recipient;
  }
}

export const transferOwnershipBC = async (recipient) => {
  try{
    // await contract.methods.setCommissionRecipient(recipient).send({ from: window.ethereum.selectedAddress }); // Call the smart contract function
    return "Role MINTER revoked successfully to " + recipient;
  } catch (error) {
    console.error("Couldn't revoke MINTER role to " + recipient + ":", error);
    return "Couldn't revoke MINTER role to " + recipient;
  }
}

export const getOwnedNFTs = async () => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const contract = new Contract(contractAddress, contractABI, provider)
    const proxyResult = await contract.getCustomerTokens.staticCallResult(window.ethereum.selectedAddress)
    return Array.from(proxyResult[0])
  } catch (error) {
    console.error("Error retrieving owned NFTs:", error);
    return [];
  }
};

export const getNTFUri = async (tokenId) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const contract = new Contract(contractAddress, contractABI, provider)
    const proxyResult = await contract.tokenURI.staticCallResult(tokenId)
    return proxyResult[0]
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