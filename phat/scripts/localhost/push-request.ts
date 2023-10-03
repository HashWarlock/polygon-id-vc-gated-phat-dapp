import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const Counter = await ethers.getContractFactory("Counter");

  const [deployer] = await ethers.getSigners();

  const consumerSC = process.env["LOCALHOST_CONSUMER_CONTRACT_ADDRESS"] || "";
  if (!consumerSC) {
    console.error("Error: Please provide LOCALHOST_CONSUMER_CONTRACT_ADDRESS");
    process.exit(1);
  }
  const consumer = Counter.attach(consumerSC);
  console.log("Pushing a request...");
  await consumer.connect(deployer).increment();
  consumer.on("ResponseReceived", async (reqId: number, pair: number, value: string) => {
    console.info("Received event [ResponseReceived]:", {
      reqId,
      pair,
      value,
    });
    process.exit();
  });
  consumer.on("ErrorReceived", async (reqId: number, pair: number, value: string) => {
    console.info("Received event [ErrorReceived]:", {
      reqId,
      pair,
      value,
    });
    process.exit();
  });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
