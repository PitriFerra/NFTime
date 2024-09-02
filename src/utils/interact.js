import { pinJSONToIPFS } from "./pinata.js";
import { Contract, ethers } from "ethers";

require("dotenv").config();

const contractABI = require("../contract-abi.json");
const contractAddress = "0x390bb5Ab7bE807dB2b6BE5261B381d5D5C0479b4";

export const mintToken = async (recipient, watch, metadataInput) => {
  console.log("Minting token with metadata:", metadataInput);
  // error handling --------------------------------------------------------
  if (recipient.trim() === "")
    return {
      success: false,
      status: "❗Please make sure all fields are completed before minting.",
    };
  // -----------------------------------------------------------------------

  // make metadata ---------------------------------------
  const metadata = {};
  metadata.name = watch.model;
  metadata.image = watch.image;
  metadata.description = metadataInput.description;
  metadata.attributes = [
    ...watch.colors.map((color) => ({
      trait_type: "colors",
      value: color,
    })),
    {
      trait_type: "year_of_production",
      value: metadataInput.productionYear,
    },
    {
      trait_type: "weight",
      value: metadataInput.weight,
    },
    {
      trait_type: "certifier",
      value: window.ethereum.selectedAddress,
    },
    {
      trait_type: "brand",
      value: watch.brand,
    },
  ];
  // -----------------------------------------------------

  const pinataResponse = await pinJSONToIPFS(metadata); // pinata pin request

  if (!pinataResponse.success)
    return {
      success: false,
      status: "😢 Something went wrong while uploading your tokenURI.",
    };

  const tokenURI = pinataResponse.pinataUrl;

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    const tx = await contract.safeMint(
      recipient,
      tokenURI,
      metadataInput.price,
    );

    const receipt = await tx.wait();

    if (receipt.logs) {
      for (const log of receipt.logs) {
        try {
          const event = contract.interface.parseLog(log);
          if (event) {
            console.log("Event found:", event.name);
            console.log("Event arguments:", event.args);

            // If you're expecting a specific event, you can check for it here
            if (event.name === "Transfer") {
              const tokenId = event.args.tokenId;
              console.log("Minted token ID:", tokenId.toString());
            }

            // If there's a custom event with the result, check for it here
            if (event.name === "MintResult") {
              const result = event.args.result; // Adjust 'result' to match your event structure
              console.log("Mint result:", result.toString());
            }
          }
        } catch (parseError) {
          console.log("Couldn't parse log:", log);
          return {
            success: false,
            status: "😥 Something went wrong: " + parseError.message,
          };
        }
      }
    }

    return {
      success: true,
      status: "✅ Something went right, result: " + receipt.transactionHash,
    };
  } catch (error) {
    console.error("Error minting NFT:", error);
    return {
      success: false,
      status: "😥 Something went wrong: " + error.message,
    };
  }
};

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
            <a
              rel="noreferrer"
              target="_blank"
              href={`https://metamask.io/download.html`}
            >
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
  } else return installEthereum();
};

export const isRole = async (role) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider,
    );
    return await contract.hasRole(role, window.ethereum.selectedAddress);
  } catch (error) {
    console.error("Error retrieving role validity:", error);
    return false;
  }
};

export const pause = async () => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    return await contract.pause();
  } catch (error) {
    console.error("Error retrieving role validity:", error);
    return false;
  }
};

export const unpause = async () => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    return await contract.unpause();
  } catch (error) {
    console.error("Error retrieving role validity:", error);
    return false;
  }
};

export const grantMINTER_RoleFunction = async (recipient) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    console.log("recepient", recipient);

    await contract.addCertifier(recipient, "");
    return "Role MINTER granted successfully to " + recipient;
  } catch (error) {
    console.error("Couldn't grant MINTER role to " + recipient + ":", error);
    return "Couldn't grant MINTER role to " + recipient;
  }
};

export const revokeMINTER_RoleFunction = async (recipient) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    await contract.removeCertifier(recipient);
    return "Role MINTER revoked successfully to " + recipient;
  } catch (error) {
    console.error("Couldn't revoke MINTER role to " + recipient + ":", error);
    return "Couldn't revoke MINTER role to " + recipient;
  }
};

export const transferOwnershipBC = async (recipient) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log("recepient", recipient);
    return await contract.tranferBrandAddressOwnership(recipient);
  } catch (error) {
    console.error("Couldn't trasnfer brand ownership role to " + recipient + ":", error);
    return "Couldn't trasnfer brand ownership role to " + recipient;
  }
};

export const getOwnedNFTs = async () => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new Contract(contractAddress, contractABI, provider);
    const proxyResult = await contract.getCustomerTokens.staticCallResult(
      window.ethereum.selectedAddress,
    );
    return Array.from(proxyResult[0]);
  } catch (error) {
    console.error("Error retrieving owned NFTs:", error);
    return [];
  }
};

export const getNTFUri = async (tokenId) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new Contract(contractAddress, contractABI, provider);
    const proxyResult = await contract.tokenURI.staticCallResult(tokenId);
    return proxyResult[0];
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
          <a
            rel="noreferrer"
            target="_blank"
            href={`https://metamask.io/download.html`}
          >
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
};
