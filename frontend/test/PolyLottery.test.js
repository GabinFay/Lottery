const { expect } = require("chai");
const { ethers } = require("hardhat");
require("dotenv").config();

describe("PolyLottery on Testnet", function () {
  let polyLottery;
  let owner, addr1, addr2;
  const ticketPrice = ethers.parseEther("0.001"); // 0.001 MATIC
  const deployedAddress = process.env.DEPLOYED_CONTRACT_ADDRESS; // Get the address from .env file

  // Increase timeout to 2 minutes (120000 ms)
  this.timeout(120000);

  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Attach to the deployed contract
    const PolyLottery = await ethers.getContractFactory("PolyLottery");
    polyLottery = PolyLottery.attach(deployedAddress);

    // Add this new function to check network connection
    async function waitForConnection(maxAttempts = 30, interval = 2000) {
      for (let i = 0; i < maxAttempts; i++) {
        try {
          console.log(`Attempt ${i + 1} to connect to the network...`);
          await ethers.provider.getNetwork();
          console.log("Successfully connected to the network!");
          return true;
        } catch (error) {
          console.log(`Connection attempt failed: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }
      throw new Error("Failed to connect to the network after multiple attempts");
    }

    // Wait for connection before proceeding
    await waitForConnection();
  });

  it("Should allow buying tickets and run a full lottery cycle", async function () {
    try {
      console.log("Starting test...");
      console.log("Deployed contract address:", deployedAddress);

      // Check connection again before buying tickets
      console.log("Checking network connection before buying tickets...");
      await ethers.provider.getNetwork();
      console.log("Network connection confirmed.");

      // let endTxstart;
      // console.log("Creating a new lottery now");
      // endTxstart = await polyLottery.connect(owner).startNewLottery(ticketPrice, 3600);
      // await endTxstart.wait();

      // Participants buy tickets
      console.log("Buying tickets...");
      const tx1 = await polyLottery.connect(addr1).buyTickets(2, { value: ticketPrice * 2n });
      await tx1.wait();
      console.log("Addr1 bought 2 tickets");

      const tx2 = await polyLottery.connect(addr2).buyTickets(3, { value: ticketPrice * 3n });
      await tx2.wait();
      console.log("Addr2 bought 3 tickets");

      // Check total tickets sold
      console.log("Checking participants and tickets...");
      const participants = await polyLottery.getParticipants();
      console.log("Participants:", participants);
      expect(participants).to.include(addr1.address);
      expect(participants).to.include(addr2.address);

      const totalTickets = await polyLottery.getTotalTickets();
      console.log("Total tickets:", totalTickets);
      expect(totalTickets).to.equal(5); // 2 + 3 = 5 tickets

      const ticketCounts = await polyLottery.getTicketCounts();
      console.log("Ticket counts:", ticketCounts);
      expect(ticketCounts[0]).to.equal(2); // addr1 bought 2 tickets
      expect(ticketCounts[1]).to.equal(3); // addr2 bought 3 tickets

      // Get initial balances
      console.log("Getting initial balances...");
      const initialAddr1Balance = await ethers.provider.getBalance(addr1.address);
      const initialAddr2Balance = await ethers.provider.getBalance(addr2.address);
      console.log("Initial Addr1 balance:", ethers.formatEther(initialAddr1Balance));
      console.log("Initial Addr2 balance:", ethers.formatEther(initialAddr2Balance));

      // End the lottery
      console.log("Ending the lottery...");
      const lotteryEndingInitiatedBefore = await polyLottery.lotteryEndingInitiated();
      console.log("lotteryEndingInitiated before endLottery:", lotteryEndingInitiatedBefore);

      let endTx, endTxReceipt;
      try {
        endTx = await polyLottery.connect(owner).endLottery();
        endTxReceipt = await endTx.wait();
        console.log("End lottery transaction hash:", endTxReceipt.hash);
      } catch (error) {
        console.error("Error ending lottery:", error.message);
        if (error.transaction) {
          console.log("Failed transaction hash:", error.transaction.hash);
          try {
            endTxReceipt = await ethers.provider.getTransactionReceipt(error.transaction.hash);
          } catch (receiptError) {
            console.error("Error fetching transaction receipt:", receiptError.message);
          }
        }
      }

      // Wait for the LotteryEnded event
      console.log("Waiting for LotteryEnded event...");
      return new Promise((resolve, reject) => {
        polyLottery.once("LotteryEnded", async (winnerAddress, prize, event) => {
          console.log("LotteryEnded event received!");
          console.log("Winner:", winnerAddress);
          console.log("Prize:", ethers.formatEther(prize), "MATIC");

          try {
            // Verify that a winner was selected
            expect(winnerAddress).to.not.equal(ethers.ZeroAddress);

            // Check if the winner is one of the participants
            const participants = await polyLottery.getParticipants();
            expect(participants).to.include(winnerAddress);

            // Get final balances
            const finalAddr1Balance = await ethers.provider.getBalance(addr1.address);
            const finalAddr2Balance = await ethers.provider.getBalance(addr2.address);

            // Calculate balance changes
            const addr1BalanceChange = finalAddr1Balance - initialAddr1Balance;
            const addr2BalanceChange = finalAddr2Balance - initialAddr2Balance;

            console.log("Addr1 balance change:", ethers.formatEther(addr1BalanceChange));
            console.log("Addr2 balance change:", ethers.formatEther(addr2BalanceChange));

            // Verify that one of the participants received the prize
            expect(addr1BalanceChange > 0 || addr2BalanceChange > 0).to.be.true;

            // Check the lottery balance (should be close to zero)
            const lotteryBalance = await polyLottery.getLotteryBalance();
            expect(lotteryBalance).to.be.lte(ethers.parseEther("0.000001")); // allowing for a small amount of dust

            console.log("Starting a new lottery...");
            const newLotteryTx = await polyLottery.connect(owner).startNewLottery(ticketPrice, 3600);
            await newLotteryTx.wait();

            // Wait for and check the NewLotteryStarted event
            console.log("Waiting for NewLotteryStarted event...");
            const filter = polyLottery.filters.NewLotteryStarted();
            const events = await polyLottery.queryFilter(filter, newLotteryTx.blockNumber, "latest");
            expect(events.length).to.be.greaterThan(0, "NewLotteryStarted event not emitted");
            console.log("NewLotteryStarted event received");

            console.log("Test completed successfully!");
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        // Set a timeout in case the event is not received
        setTimeout(() => {
          reject(new Error("Timeout: LotteryEnded event not received"));
        }, 300000); // 5 minutes timeout
      });
    } catch (error) {
      console.error("Detailed error:", error);
      throw error;
    }
  });
});
