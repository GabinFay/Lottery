const { ethers } = require("ethers");

async function sendToENS(ensName, amount) {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");
  const signer = new ethers.Wallet("", provider);
  
  // Manually specify the ENS Registry address
  const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  const ensRegistryAbi = ["function resolver(bytes32 node) view returns (address)"];
  const ensRegistry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensRegistryAbi, provider);
  
  // Get the resolver address
  const namehash = ethers.namehash(ensName);
  const resolverAddress = await ensRegistry.resolver(namehash);
  
  // Use the resolver to get the address
  const resolverAbi = ["function addr(bytes32 node) view returns (address)"];
  const resolver = new ethers.Contract(resolverAddress, resolverAbi, provider);
  const address = await resolver.addr(namehash);
  
  // Send transaction
  const tx = await signer.sendTransaction({
    to: address,
    value: ethers.parseEther(amount)
  });
  
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log("Transaction confirmed");
  console.log(address)
}

sendToENS("vitalik.eth", "0.1");
