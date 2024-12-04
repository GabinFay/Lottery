const hre = require("hardhat");

async function main() {
  const ticketPrice = hre.ethers.parseEther("0.001"); // 0.001 MATIC
  const lotteryDuration = 3600; // 1 hour
  const vrfCoordinator = "0x343300b5d84D444B2ADc9116FEF1bED02BE49Cf2"; // Amoy VRF Coordinator
  const subscriptionId = ""; // Replace with your actual subscription ID
  const keyHash = "0x816bedba8a50b294e5cbd47842baf240c2385f2eaf719edbd4f250a137a8c899"; // Amoy keyHash

  const PolyLottery = await hre.ethers.getContractFactory("PolyLottery");
  const polyLottery = await PolyLottery.deploy(
    ticketPrice,
    lotteryDuration,
    vrfCoordinator,
    subscriptionId,
    keyHash
  );

  await polyLottery.waitForDeployment();

  console.log("PolyLottery deployed to:", await polyLottery.getAddress());

  // Add the contract to the VRFCoordinatorV2

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
