import hardhat from "hardhat";

async function main() {
  const { ethers } = hardhat;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const CheckIn = await ethers.getContractFactory("CheckIn");
  const checkIn = await CheckIn.deploy();
  await checkIn.waitForDeployment();

  console.log("CheckIn deployed to:", await checkIn.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
