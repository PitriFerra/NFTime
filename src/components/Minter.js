import React, { useEffect, useState, useCallback } from "react";
import { connectWallet, getCurrentWalletConnected, mintNFT, getBrandValidity, getOwnedNFTs } from "../utils/interact.js";
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
    const brandValidity = await getBrandValidity();

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
        const allWatchData = fetchedData.flat(); // Assuming fetchedData is an array of arrays, you may need to adjust accordingly

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
        <div>
          <p>Simply add the address of the recipient, select the desired watch from the list and then press "Mint NFT".</p>
          <h2>Recipient: </h2>
          <input type="text" placeholder="0x..." onChange={(event) => setRecipient(event.target.value)}/>
        </div>
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
                {/* Add any additional watch details as needed */}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      { brandLogged && (
        <button id="mintButton" onClick={onMintPressed}>Mint NFT</button>
      )}
      <p id="status">{ status }</p>
    </div>
  );
};

export default Minter;