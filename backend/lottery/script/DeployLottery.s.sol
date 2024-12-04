// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Lottery.sol";

contract DeployLottery is Script {
    function run() external {
        // Load the deployer's private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // VRF parameters for deployment
        address vrfCoordinator = 0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634; // Correct checksummed address
        bytes32 keyHash = 0x00b81b5a830cb0a4009fbd8904de511e28631e62ce5ad231373d3cdad373ccab; // Example hash
        uint256 subscriptionId = vm.envUint("SUBSCRIPTION_ID");

        // Constructor parameters
        uint256 ticketPrice = 0.01 ether; // Example ticket price
        uint256 lotteryDuration = 7 days; // Example duration

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the Lottery contract
        Lottery lottery = new Lottery(
            ticketPrice,
            lotteryDuration,
            vrfCoordinator,
            subscriptionId,
            keyHash
        );

        vm.stopBroadcast();

        // Log the deployed contract address
        console.log("Lottery deployed at:", address(lottery));
    }
}
