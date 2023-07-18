import React, { useEffect, useState } from "react";
import { connectWallet, getCurrentWalletConnected, mintNFT, getBrandValidity } from "../utils/interact.js";
import { db } from '../firebase.js'; // Import Firestore database
import { collection, getDocs } from "firebase/firestore";
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

const Minter = (props) => {
  //State variables ----------------------------------
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [recipient, setRecipient] = useState("");
	const [info, setInfo] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState([]); // Filtered watches
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [brandLogged, setBrandLogged] = useState(false);
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
      setBrandLogged(false);
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
    if (selectedWatch) {
      const { status } = await mintNFT(recipient, selectedWatch);
      setStatus(status);
    } else {
      setStatus("Please select an item from the list.");
    }
  };

  const loginBrandPressed = async () => {
    const brandValidity = await getBrandValidity();
    setBrandLogged(brandValidity.result);
    setStatus(brandValidity.status);
  }

  const handleFilterChange = (event) => {
    const value = event.target.value.toLowerCase();
    const filteredData = info.filter((watch) =>
      watch.model.toLowerCase().includes(value) || watch.brand.toLowerCase().includes(value)
    );
    setFilteredInfo(filteredData);
  };

  const handleCardClick = (watch) => {
    setSelectedWatch(watch);
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
      { walletAddress.length > 0 && !brandLogged && (
        <button id="brandButton" onClick={loginBrandPressed}>
          <span>Login as brand</span>
        </button>
      )}      
      <br></br>
      { brandLogged && (
        <div>
          <h1 id="title">🧙‍♂️ NFTime Minter</h1>
          <p>
            Simply add the address of the recipient, select the desired watch from the list and then press "Mint NFT".
          </p>
          <form>
            <h2>Recipient: </h2>
            <input
              type="text"
              placeholder="0x..."
              onChange={(event) => setRecipient(event.target.value)}
            />
            <Form.Control
              autoFocus
              className="mx-3 my-2 w-auto"
              placeholder="Type to filter..."
              onChange={handleFilterChange}
            />
            <Row xs={1} md={5} className="g-4">
              {filteredInfo.map((watch, idx) => (
                <Col key={idx}>
                  <Card className={`bg-${selectedWatch === watch ? "info" : "light"}`} onClick={() => handleCardClick(watch)}>
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
          </form>
          <button id="mintButton" onClick={onMintPressed}>
            Mint NFT
          </button>
        </div>
      )}
      <p id="status">
        {status}
      </p>
    </div>
  );
};

export default Minter;