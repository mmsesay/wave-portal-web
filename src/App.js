import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";
import "./App.css";

export default function App() {
  /*
   * Just a state variable we use to store our user's public wallet.
   */
  // const [ethereum] = useState(window);
  const [currentAccount, setCurrentAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [allWaves, setAllWaves] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [info, setInfo] = useState("");

  const contractAddress = "0xBA41AC8cc1aacfb27c1328FE6B477055fe50cf77";
  const contractABI = abi.abi;

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        /*
         * Execute the actual wave from your smart contract
         */
        if (inputMessage !== "") {
          setLoading(true);

          let count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());

          const waveTxn = await wavePortalContract.wave(inputMessage, {
            gasLimit: 300000,
          });
          console.log("Waved!", waveTxn.hash);

          const inProgress = await waveTxn.wait();
          inProgress && setLoading(false);
          setInputMessage(""); // clear the input message
          console.log("Mined -- ", waveTxn.hash);
          getAllWaves();

          count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());
        } else {
          setInfo("Please enter a message to wave!");
          console.log("Please enter a message to wave!");
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
       * Check if we're authorized to access the user's wallet
       */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves(); // invoke the getAllWaves method
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        // sort the waves by timestamp so that newest waves are at the top
        wavesCleaned.sort(
          (a, b) => new Date(b.timestamp * 1000) - new Date(a.timestamp * 1000)
        );

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    setTimeout(() => {
      setInfo("");
    }, 5000);

    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);

      // sort the waves by timestamp so that newest waves are at the top
      allWaves.sort(
        (a, b) => new Date(b.timestamp * 1000) - new Date(a.timestamp * 1000)
      );
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, [info]);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">👋 Hey there!</div>

        <div className="bio">
          I am maej, a developer with the rhymes! Connect your Ethereum wallet
          and wave at me!
        </div>

        {info && <p className="info-text">{info}</p>}

        {/*
         * If there is no currentAccount render this button
         */}
        {!currentAccount ? (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <>
            <input
              type="text"
              placeholder="Have a message? Type it here!"
              className="message-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button className="waveButton" onClick={wave}>
              {loading ? (
                <img
                  className="spinner"
                  src="/spinner/spinner.svg"
                  alt="spinnerIcon"
                />
              ) : (
                "Wave at Me"
              )}
            </button>

            {/* wave messages */}
            <div className="allwaves-container">
              {allWaves.map((wave, index) => {
                return (
                  <div key={index} className="message">
                    <div>From: {wave.address}</div>
                    <div>Time: {wave.timestamp.toString().slice(0, 28)}</div>
                    <div className="message-text-container">
                      Message:{" "}
                      <span className="message-text">{wave.message}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
