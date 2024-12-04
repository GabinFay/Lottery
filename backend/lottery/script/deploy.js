require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    // Load environment variables
    const providerUrl = process.env.PROVIDER_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const subscriptionId = process.env.SUBSCRIPTION_ID;

    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Read ABI and bytecode from the JSON file
    const lotteryJsonPath = path.join(__dirname, 'out', 'Lottery.sol', 'Lottery.json');
    const lotteryJson = JSON.parse(fs.readFileSync(lotteryJsonPath, 'utf8'));
    const abi = lotteryJson.abi;
    const bytecode = lotteryJson.bytecode.object;

    // Define constructor arguments
    const lotteryDuration = 3600; // Example: 1 hour in seconds
    const vrfCoordinator = '0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634'; // Replace with actual VRF Coordinator address
    const keyHash = '0x00b81b5a830cb0a4009fbd8904de511e28631e62ce5ad231373d3cdad373ccab'; // Replace with actual key hash

    // Create a contract factory
    const LotteryFactory = new ethers.ContractFactory(abi, bytecode, wallet);

    // Deploy the contract
    const lotteryContract = await LotteryFactory.deploy(
        lotteryDuration,
        vrfCoordinator,
        subscriptionId,
        keyHash,
        {

            gasPrice: ethers.utils.parseUnits('0.03', 'gwei')
        }
    );

    console.log('Deploying Lottery contract...');
    await lotteryContract.deploymentTransaction().wait();
    console.log(`Lottery contract deployed at address: ${lotteryContract.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
