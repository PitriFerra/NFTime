import React, { useEffect, useState, useCallback } from "react";
import * as interact from "../utils/interact.js";
import { db } from "../firebase.ts"; // Import Firestore database
import { collection, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardImage,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getNTFUri } from "../utils/interact.js";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Minter = (props) => {
  //State variables ----------------------------------
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [recipient, setRecipient] = useState("");
  const [ownedWatches, setOwnedWatches] = useState([]);
  const [info, setInfo] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState([]); // Filtered watches
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [rolesLogged, setRolesLogged] = useState([]);
  const [show, setShow] = useState(false);
  const [metadata, setMetadata] = useState({
    price: 10000.0,
    weight: 90.0,
    description: "Beautiful watch in perfect condition.",
    productionYear: new Date().getFullYear(),
  });
  // -------------------------------------------------

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Fetch the required data using the get() method
  const fetchDataFromDB = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "watches"));
      const data = querySnapshot.docs.map((doc) => doc.data());
      setInfo(data);
      setFilteredInfo(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const login = useCallback(async (walletResponse) => {
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
    setRolesLogged([]);
    const roles = [];

    if (
      await interact.isRole(
        "0xf774bc261b2d29c2c10f1fa068e72ec6cd0912ac3740a256a7a6e8d0255d6487",
      )
    )
      roles.push("PAUSER");

    if (
      await interact.isRole(
        "0x52fbef00e7466c1a0fe0097941e8c04693893065e040396c3d2d0a9d450b8f7a",
      )
    )
      roles.push("BURNER");

    if (
      await interact.isRole(
        "0x619937ab08bc2c0699dba71ae4b71585cb74f8e5e91a3066a9b2a4d85dfe0a5d",
      )
    ) {
      roles.push("MINTER");
      fetchDataFromDB();
    }

    // Update state with all roles at once
    setRolesLogged((prevRoles) => [...prevRoles, ...roles]);
    let ownedNFTs = await interact.getOwnedNFTs();

    const ownedNFTTokenPromises = ownedNFTs.map((tokenId) =>
      getNTFUri(tokenId),
    );
    ownedNFTs = await Promise.all(ownedNFTTokenPromises);
    console.log("ownedNFTs", ownedNFTs);

    try {
      const responses = await Promise.all(ownedNFTs.map((url) => fetch(url)));
      const dataPromises = responses.map((response) => response.json());
      const fetchedData = await Promise.all(dataPromises);
      const allWatchData = fetchedData.flat();

      // Map the "name" field to "model"
      const transformedData = allWatchData.map((watch) => {
        const brandAttribute = watch.attributes.find(
          (attribute) => attribute.trait_type === "brand",
        );

        const yearOfProductionAttribute = watch.attributes.find(
          (attribute) => attribute.trait_type === "year_of_production",
        );

        const weight = watch.attributes.find(
          (attribute) => attribute.trait_type === "weight",
        );

        const brand = brandAttribute ? brandAttribute.value : "Unknown Brand";
        const yearOfProduction = yearOfProductionAttribute
          ? parseInt(yearOfProductionAttribute.value)
          : 0; // You can set a default value for year if it's not available

        return {
          ...watch,
          model: watch.name,
          brand,
          weight: weight?.value,
          year_of_production: yearOfProduction,
        };
      });
      setOwnedWatches(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  const addWalletListener = useCallback(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        const walletResponse = await interact.getCurrentWalletConnected();
        login(walletResponse);
      });
    } else {
      setStatus(
        "You must install Metamask, a virtual Ethereum wallet, in your browser.",
      );
    }
  }, [login]);

  useEffect(() => {
    async function initializePage() {
      const walletResponse = await interact.getCurrentWalletConnected();
      console.log("walletResponse", walletResponse);
      if (!window.ethereum.selectedAddress) return;
      login(walletResponse);
      addWalletListener();
    }

    initializePage();
  }, [addWalletListener, login]);

  const connectWalletPressed = async () => {
    const walletResponse = await interact.connectWallet();
    login(walletResponse);
  };

  const onMintPressed = async () => {
    if (
      metadata.price == null ||
      metadata.weight == null ||
      metadata.description == null ||
      metadata.productionYear == null
    ) {
      console.log(metadata);
      setStatus("Please fill out all the fields.");
    } else if (selectedWatch) {
      const { status } = await interact.mintToken(
        recipient,
        selectedWatch,
        metadata,
      );
      setStatus(status);
    } else {
      setStatus("Please select an item from the list.");
    }
  };

  const grantMINTER_Role = async () => {
    setStatus(await interact.grantMINTER_RoleFunction(recipient));
  };

  const revokeMINTER_Role = async () => {
    setStatus(await interact.revokeMINTER_RoleFunction(recipient));
  };

  const pauseClicked = async () => {
    setStatus(
      (await interact.pause())
        ? "Contract successfully paused"
        : "Error in pausing contract",
    );
  };

  const unpauseClicked = async () => {
    setStatus(
      (await interact.unpause())
        ? "Contract successfully unpaused"
        : "Error in unpausing contract",
    );
  };

  const transferOwnership = async () => {
    setStatus(await interact.transferOwnershipBC(recipient));
  };

  const handleFilterChange = (event) => {
    const value = event.target.value.toLowerCase();
    const filteredData = info.filter(
      (watch) =>
        watch.model.toLowerCase().includes(value) ||
        watch.brand.toLowerCase().includes(value),
    );
    setFilteredInfo(filteredData);
  };

  const handleCardClick = (watch) => {
    setSelectedWatch(watch);
  };

  const handleSellNFT = () => {
    // interact.onSellNFT(selectedWatch, price); // Call the onSellNFT function with the selected watch and price
    handleClose(); // Close the modal
  };

  return (
    <div className="Minter m-5">
      <div
        className={
          "flex flex-row font-bold justify-between sticky top-0 bg-white py-4"
        }
      >
        <h1 className="text-3xl underline">Welcome to NFTime ⌚</h1>
        <div className={"flex flex-row items-center space-x-2"}>
          <span>Status: </span>
          <p id="status">{status}</p>
          <Button id="walletButton" onClick={connectWalletPressed}>
            {walletAddress.length > 0 ? (
              "Connected: " +
              String(walletAddress).substring(0, 6) +
              "..." +
              String(walletAddress).substring(38)
            ) : (
              <span>Connect Wallet</span>
            )}
          </Button>
        </div>
      </div>
      <div className={"divide-y"}>
        <div className={"py-6"}>
          <h1 id="title" className={"font-bold"}>
            {rolesLogged.includes("PAUSER") && "⌚️ Owned NFT Watches"}
          </h1>

          <div className="flex flex-row flex-wrap space-x-2">
            {ownedWatches.map((watch, idx) => (
              <div className="flex flex-col" xs={8} key={idx}>
                <Card
                  className="light"
                  onClick={() => {
                    handleCardClick(watch);
                    setShow(true);
                  }}
                >
                  <CardImage
                    variant="top"
                    src={watch.image}
                    style={{ width: 300, height: 150, objectFit: "cover" }}
                  />
                  <CardContent>
                    <CardTitle>{watch.model}</CardTitle>
                    <CardDescription>
                      {watch.brand} - {watch.year_of_production}{" "}
                      {" - " + watch.weight + "g"}
                    </CardDescription>
                    {rolesLogged.length === 0 && (
                      <Button variant="primary" onClick={handleShow}>
                        Sell
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
        <div className={"py-6"}>
          <h1 id="title" className={"font-bold"}>
            {rolesLogged.includes("PAUSER") && "🧙‍♂️ NFTime Pauser"}
          </h1>
          {rolesLogged.includes("PAUSER") && (
            <>
              <Input
                type="text"
                placeholder="0x..."
                onChange={(event) => setRecipient(event.target.value)}
              />
              <div className={"space-x-2 mt-2"}>
                <Button onClick={pauseClicked}>Pause</Button>
                <Button onClick={unpauseClicked}>Unpause</Button>
                <Button onClick={transferOwnership}>Transfer ownership</Button>
              </div>
            </>
          )}
        </div>
        <div className={"py-6"}>
          <h1 id="title" className={"font-bold"}>
            {rolesLogged.includes("BURNER") && "🔥 NFTime Burner"}
          </h1>
          {rolesLogged.includes("BURNER") && (
            <>
              <Input
                type="text"
                placeholder="0x..."
                onChange={(event) => setRecipient(event.target.value)}
              />
              <div className={"space-x-2 mt-2"}>
                <Button type="button" onClick={grantMINTER_Role}>
                  Grant MINTER role
                </Button>
                <Button onClick={revokeMINTER_Role}>Revoke MINTER role</Button>
              </div>
            </>
          )}
        </div>
        <div className={"py-6"}>
          <h1 id="title2" className={"font-bold"}>
            {rolesLogged.includes("MINTER") && "⛏️ NFTime Minter"}
          </h1>
          {rolesLogged.includes("MINTER") && (
            <>
              <p>
                Simply add the address of the recipient, select the desired
                watch from the list and then press "Mint NFT".
              </p>
              <div className={"flex flex-row space-x-2 items-center"}>
                <span>Recipient: </span>
                <Input
                  type="text"
                  placeholder="0x..."
                  onChange={(event) => setRecipient(event.target.value)}
                />
              </div>
            </>
          )}
          {filteredInfo.length > 0 && (
            <Input
              autoFocus
              className="my-2 w-auto"
              placeholder="Type to filter..."
              onChange={handleFilterChange}
            />
          )}
          <div className="flex flex-row flex-wrap gap-2">
            {filteredInfo.map((watch, idx) => (
              <div className="flex flex-col" xs={8} key={idx}>
                <Card
                  className={`bg-${selectedWatch === watch ? "primary text-white" : "light"}`}
                  onClick={() => handleCardClick(watch)}
                >
                  <CardImage
                    variant="top"
                    src={watch.image}
                    style={{ width: 300, height: 150, objectFit: "cover" }}
                  />
                  <CardContent>
                    <CardTitle>{watch.model}</CardTitle>
                    <CardDescription>
                      {watch.brand} - {watch.year_of_production}
                    </CardDescription>
                    {rolesLogged.length === 0 && (
                      <Button variant="primary" onClick={handleShow}>
                        Sell
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          <div className="grid w-full max-w-sm mt-2 items-center gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Beautiful watch in perfect condition."
              defaultValue={metadata.description}
              onChange={(event) =>
                setMetadata({
                  ...metadata,
                  description: event.target.value,
                })
              }
            />
          </div>
          <div className="grid w-full max-w-sm mt-2 items-center gap-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              type="number"
              id="price"
              placeholder="10000.00"
              defaultValue={metadata.price}
              onChange={(event) =>
                setMetadata({
                  ...metadata,
                  price: event.target.value,
                })
              }
            />
          </div>
          <div className="grid w-full max-w-sm mt-2 items-center gap-1.5">
            <Label htmlFor="weight">Weight (g)</Label>
            <Input
              type="number"
              id="weight"
              placeholder="90.00"
              defaultValue={metadata.weight}
              step="0.01"
              onChange={(event) =>
                setMetadata({
                  ...metadata,
                  weight: event.target.value,
                })
              }
            />
          </div>
          <div className="grid w-full max-w-sm mt-2 items-center gap-1.5">
            <Label htmlFor="productionYear">Year of production</Label>
            <Input
              type="number"
              min="1900"
              max="2099"
              step="1"
              id="productionYear"
              defaultValue={metadata.productionYear}
              placeholder="2000"
              onChange={(event) =>
                setMetadata({
                  ...metadata,
                  productionYear: event.target.value,
                })
              }
            />
          </div>
          {rolesLogged.includes("MINTER") && (
            <Button className={"my-2"} id="mintButton" onClick={onMintPressed}>
              Mint NFT
            </Button>
          )}
        </div>
      </div>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell NFT</DialogTitle>
          </DialogHeader>
          {selectedWatch && (
            <>
              <CardImage src={selectedWatch.image} alt={selectedWatch.model} />
              <div className="flex flex-row">
                <div className="flex flex-col" xs={8}>
                  <h5>
                    <strong>Model:</strong> {selectedWatch.model}
                  </h5>
                  <p>
                    <strong>Brand:</strong> {selectedWatch.brand}
                  </p>
                  <p>
                    <strong>Year of Production:</strong>{" "}
                    {selectedWatch.year_of_production}
                  </p>
                  <p>
                    <strong>Description:</strong> {selectedWatch.description}
                  </p>
                  {/* Add other watch details as needed */}
                </div>
              </div>
              <hr />
              {/* Horizontal line to separate data from input */}
              <div className="flex flex-row">
                <div className="flex flex-col" xs={8}>
                  <p>
                    <strong>What should be the price of the NFT?</strong>
                  </p>
                  <div style={{ display: "flex" }}>
                    <Input
                      type="number"
                      placeholder="0"
                      style={{ width: "15%", marginRight: "5px" }}
                    />
                    <span style={{ paddingTop: "8px" }}>ETH</span>
                  </div>
                </div>
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={handleSellNFT}>Sell</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Minter;
