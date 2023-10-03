import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const Counter = await ethers.getContractFactory("Counter");

  const [deployer] = await ethers.getSigners();

  const consumerSC = process.env['POLYGON_CONSUMER_CONTRACT_ADDRESS'] || "";
  const consumer = Counter.attach(consumerSC);
  await Promise.all([
    consumer.deployed(),
  ])

  console.log('Pushing a request...');
  await consumer.connect(deployer).increment();
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
