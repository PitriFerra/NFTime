import React, { useEffect, useState } from "react";
import { connectWallet, getCurrentWalletConnected, mintNFT } from "../utils/interact.js";
import { db } from '../firebase.js'; // Import Firestore database
import { collection, getDocs } from "firebase/firestore";
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';

const Minter = (props) => {
  //State variables ----------------------------------
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hash, setHash] = useState("");
  const [recipient, setRecipient] = useState("");
	const [info, setInfo] = useState([]);
  // -------------------------------------------------

  // Fetch the required data using the get() method
  const Fetchdata = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "watches"));
      const data = querySnapshot.docs.map(doc => doc.data());
      setInfo(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus("👆🏽 Write a message in the text-field above.");
        } else {
          setWallet("");
          setStatus("🦊 Connect to Metamask using the top right button.");
        }
      });
    } else {
      setStatus(
        <p>
          {" "}
          🦊{" "}
          <a rel="noreferrer" target="_blank" href={`https://metamask.io/download.html`}>
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.
          </a>
        </p>
      );
    }
  }
 
  useEffect(() => {
    async function fetchData() {
      const { address, status } = await getCurrentWalletConnected();
      setWallet(address);
      setStatus(status);
      addWalletListener();
      await Fetchdata();
    }
    
    fetchData();
  }, []);

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
  };

  const onMintPressed = async () => {
    const { status } = await mintNFT(hash, name, description, recipient);
    setStatus(status);
  };

  return (
    <div className="Minter">
      <div>
        <center>
          <h2>Watches Details</h2>
        </center>
        {
          info.map((data) => (
            <Frame brand={data.brand}
              model={data.model}
              year_of_production={data.year_of_production} />
          ))
        }
      </div>
      <button id="walletButton" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? (
          "Connected: " +
          String(walletAddress).substring(0, 6) +
          "..." +
          String(walletAddress).substring(38)
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>

      <br></br>
      <h1 id="title">🧙‍♂️ NFTime Minter</h1>
      <p>
        Simply add your asset's hash from Pinata, name, description and recipient then press "Mint."
      </p>
      <form>
        <h2>🖼 Hash of asset: </h2>
        <input
          type="text"
          placeholder="e.g. QmSbF9xbradCfPDeV9y1K8e92CkkJ9rdeqePFrgFSfVp9y"
          onChange={(event) => setHash(event.target.value)}
        />
        <h2>🤔 Name: </h2>
        <input
          type="text"
          placeholder="e.g. My first NFT!"
          onChange={(event) => setName(event.target.value)}
        />
        <h2>✍️ Description: </h2>
        <input
          type="text"
          placeholder="e.g. Even cooler than cryptokitties ;)"
          onChange={(event) => setDescription(event.target.value)}
        />
        <h2>Recipient: </h2>
        <input
          type="text"
          placeholder="0x..."
          onChange={(event) => setRecipient(event.target.value)}
        />
      </form>
      <button id="mintButton" onClick={onMintPressed}>
        Mint NFT
      </button>
      <p id="status">
        {status}
      </p>
    </div>
  );
};

// Define how each display entry will be structured
const Frame = ({ brand, model, year_of_production }) => {
	console.log(brand + " " + model + " " + year_of_production);
	return (
		<center>
			<div className="div">

				<p>Brand : {brand}</p>


				<p>Model : {model}</p>


				<p>Year of production : {year_of_production}</p>

			</div>
		</center>
	);
}

// The forwardRef is important!! Dropdown needs access to the DOM node in order to position the Menu
const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  >
    {children}
    &#x25bc;
  </a>
));

// forwardRef again here! Dropdown needs access to the DOM of the Menu to measure it
const CustomMenu = React.forwardRef(
  ({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
    const [value, setValue] = useState('');

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <Form.Control
          autoFocus
          className="mx-3 my-2 w-auto"
          placeholder="Type to filter..."
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <ul className="list-unstyled">
          {React.Children.toArray(children).filter(
            (child) =>
              !value || child.props.children.toLowerCase().startsWith(value),
          )}
        </ul>
      </div>
    );
  },
);

export default Minter;