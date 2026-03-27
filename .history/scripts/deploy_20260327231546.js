async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contract with account:', deployer.address);

  const NeuralMiner = await ethers.getContractFactory('NeuralMiner');
  const neuralMiner = await NeuralMiner.deploy();
  await neuralMiner.deployed();

  console.log('NeuralMiner deployed to:', neuralMiner.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
