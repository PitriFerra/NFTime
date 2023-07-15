import React, { useEffect, useState } from "react";
import { connectWallet, getCurrentWalletConnected, mintNFT } from "../utils/interact.js";
import { db } from '../firebase.js'; // Import Firestore database
import { collection, getDocs } from "firebase/firestore";
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

const Minter = (props) => {
  //State variables ----------------------------------
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hash, setHash] = useState("");
  const [recipient, setRecipient] = useState("");
	const [info, setInfo] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState([]); // Filtered watches
  // -------------------------------------------------

  // Fetch the required data using the get() method
  const Fetchdata = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "watches"));
      const data = querySnapshot.docs.map(doc => doc.data());
      setInfo(data);
      setFilteredInfo(data);
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

  const handleFilterChange = (event) => {
    const value = event.target.value.toLowerCase();
    const filteredData = info.filter((watch) =>
      watch.model.toLowerCase().includes(value) || watch.brand.toLowerCase().includes(value)
    );
    setFilteredInfo(filteredData);
  };

  return (
    <div className="Minter">
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
        Simply select the desired watch from the list, add a recipient and then press "Mint."
      </p>
      <Form.Control
        autoFocus
        className="mx-3 my-2 w-auto"
        placeholder="Type to filter..."
        onChange={handleFilterChange}
      />
      <Row xs={1} md={5} className="g-4">
        {filteredInfo.map((watch, idx) => (
          <Col key={idx}>
            <Card>
              <Card.Img variant="top" src={`https://ipfs.io/ipfs/${watch.image}`} />
              <Card.Body>
                <Card.Title>{watch.model}</Card.Title>
                <Card.Text>
                  {watch.brand} - {watch.year_of_production}
                </Card.Text>
                {/* Add any additional watch details as needed */}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
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
            (child) => {
              const childText = Array.from(child.props.children).join('').toLowerCase();
              return !value || childText.startsWith(value.toLowerCase());
            }
          )}
        </ul>
      </div>
    );
  },
);

export default Minter;