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

  console.log('Setting attestor...');
  const attestor = process.env['POLYGON_PHALA_ORACLE_ATTESTOR'] || deployer.address;
  await consumer.connect(deployer).setAttestor(attestor); // change this to the identity of your ActionOffchainRollup found in your Phala Oracle deployment labeled 'Oracle Endpoint'
  console.log(`🚨NOTE🚨\nMake sure to set the Consumer Contract Address in your Phat Contract 2.0 UI dashboard (https://bricks.phala.network)\n- Go to 'Configure Client' section where a text box reads 'Add Consumer Smart Contract'\n- Set value to ${consumerSC}`)
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
