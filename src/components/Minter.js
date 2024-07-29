import React, { useEffect, useState, useCallback } from "react";
import { connectWallet, getCurrentWalletConnected, mintNFT, getBrandValidity, getOwnedNFTs, onSellNFT, isMinter } from "../utils/interact.js";
import { db } from '../firebase.js'; // Import Firestore database
import { collection, getDocs } from "firebase/firestore";
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const Minter = (props) => {
  //State variables ----------------------------------
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [recipient, setRecipient] = useState("");
	const [info, setInfo] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState([]); // Filtered watches
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [brandLogged, setBrandLogged] = useState(false);
  const [show, setShow] = useState(false);
  const [price, setPrice] = useState(0);
  // -------------------------------------------------

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Fetch the required data using the get() method
  const fetchDataFromDB = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "watches"));
      const data = querySnapshot.docs.map(doc => doc.data());
      setInfo(data);
      setFilteredInfo(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const login = useCallback(async (walletResponse) => {
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
    const brandValidity = await isMinter();

    if(brandValidity.result) {
      setBrandLogged(true);
      fetchDataFromDB();
    } else {
      setBrandLogged(false);
      const ownedNFTs = await getOwnedNFTs();

      try {  
        const responses = await Promise.all(ownedNFTs.map(url => fetch(url)));
        const dataPromises = responses.map(response => response.json());
        const fetchedData = await Promise.all(dataPromises);
        const allWatchData = fetchedData.flat();

        // Map the "name" field to "model"
        const transformedData = allWatchData.map((watch) => {
          const brandAttribute = watch.attributes.find(
            (attribute) => attribute.trait_type === "brand"
          );
    
          const yearOfProductionAttribute = watch.attributes.find(
            (attribute) => attribute.trait_type === "year_of_production"
          );
    
          const brand = brandAttribute ? brandAttribute.value : "Unknown Brand";
          const yearOfProduction = yearOfProductionAttribute
            ? parseInt(yearOfProductionAttribute.value)
            : 0; // You can set a default value for year if it's not available
    
          return {
            ...watch,
            model: watch.name,
            brand: brand,
            year_of_production: yearOfProduction,
          };
        });
        setInfo(transformedData);
        setFilteredInfo(transformedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  }, []);
  
  const addWalletListener = useCallback(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        const walletResponse = await getCurrentWalletConnected();
        login(walletResponse);
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
  }, [login]);
 
  useEffect(() => {
    async function initializePage() {
      const walletResponse = await getCurrentWalletConnected();
      login(walletResponse);
      addWalletListener();
    }
    
    initializePage();
  }, [addWalletListener, login]);

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    login(walletResponse);
  };

  const onMintPressed = async () => {
    if (selectedWatch) {
      const { status } = await mintNFT(recipient, selectedWatch);
      setStatus(status);
    } else {
      setStatus("Please select an item from the list.");
    }
  };

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

  const handleSellNFT = () => {
    onSellNFT(selectedWatch, price); // Call the onSellNFT function with the selected watch and price
    handleClose(); // Close the modal
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
      <h1 id="title">
        {brandLogged ? (
          "🧙‍♂️ NFTime Minter"
        ) : (
          "Your NFTime Collection"
        )}        
      </h1>
      { brandLogged && (
        <>
          <p>Simply add the address of the recipient, select the desired watch from the list and then press "Mint NFT".</p>
          <h2>Recipient: </h2>
          <input type="text" placeholder="0x..." onChange={(event) => setRecipient(event.target.value)}/>
        </>
      )}
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
              <Card.Img variant="top" src={watch.image}/>
              <Card.Body>
                <Card.Title>{watch.model}</Card.Title>
                <Card.Text>
                  {watch.brand} - {watch.year_of_production}
                </Card.Text>
                { !brandLogged && (
                  <Button variant="primary" onClick={handleShow}>Sell</Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      { brandLogged && (
        <button id="mintButton" onClick={onMintPressed}>Mint NFT</button>
      )}
      <p id="status">{ status }</p>
      <Modal size="lg" centered show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Sell NFT</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWatch && (
            <>
              <Card.Img variant="top" src={selectedWatch.image} />
              <Row>
                <Col>
                  <h5><strong>Model:</strong> {selectedWatch.model}</h5>
                  <p><strong>Brand:</strong> {selectedWatch.brand}</p>
                  <p><strong>Year of Production:</strong> {selectedWatch.year_of_production}</p>
                  <p><strong>Description:</strong> {selectedWatch.description}</p>
                  {/* Add other watch details as needed */}
                </Col>
              </Row>
              <hr /> {/* Horizontal line to separate data from input */}
              <Row>
                <Col xs={8}>
                  <p><strong>What should be the price of the NFT?</strong></p>
                  <div style={{ display: 'flex' }}>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      onChange={(e) => setPrice(e.target.value)}
                      style={{ width: '15%', marginRight: '5px' }}
                    />
                    <span style={{ paddingTop: '8px' }}>ETH</span>
                  </div>
                </Col>
              </Row>
            </>
          )}          
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSellNFT}>
            Sell
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Minter;