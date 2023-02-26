import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const NETWORK_MAP = {
  1: 'mainnet',
  5: 'goerli',
  80001: 'polygon mumbai',
  137: 'polygon mainnet',
  1337: 'hardhat',
  31337: 'hardhat',
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { ethers, network, deployments } = hre;
  const chainId = parseInt(await network.provider.send("eth_chainId"));
  const networkName = NETWORK_MAP[chainId];
  const [deployer] = await ethers.getSigners();

  console.log(`Start Deployment to ${networkName} (chainId ${chainId})`);

  const deployResult = await deployments.deploy('RarementCreator', {
    from: deployer.address,
    log: true,
    proxy: {
      owner: deployer.address,
      proxyContract: 'RarementCreatorProxy',
      execute: {
        methodName: 'initialize',
        args: [],
      },
    }
  });  
  console.log(`[RarementCreator(proxy)]: ${deployResult.address}`);

  const rarementCreatorImp = await ethers.getContract('RarementCreator_Implementation', deployer);
  console.log(`[RarementCreator(implementation)]: ${rarementCreatorImp.address}`);

  const rarementCreator = await ethers.getContractAt('RarementCreator', deployResult.address);
  const beaconAddress = await rarementCreator.beaconAddress();
  console.log(`[RarementCreator.beaconAddress]: ${beaconAddress}`);

  const beacon = await ethers.getContractAt('UpgradeableBeacon', beaconAddress);
  const rarementImplAddr = await beacon.implementation();
  console.log(`[Rarement(implementation)]: ${rarementImplAddr}`);

  // const Rarement = await ethers.getContractFactory('Rarement');
  //const rarement = await ethers.getContractAt('Rarement', rarementImplAddr, deployer);
  //const tx = await rarement.initialize(deployer.address, 0, {
  //  artistId: 0,
  //  name: "Rarement",
  //  symbol: "RMNT",
  //  baseURI: "https://rmnt.xyz/metadata/",
  //  fundingRecipient: "0x2526665483520C28765917d63a7E1af89Bf3Fd15", 
  //  presalePrice: 0,
  //  presaleStartTime: 0,
  //  price: 0,
  //  royaltyBPS: 200, // bps - 200 == 0.02 of 1 == 2%
  //  startTime: 0,
  //  endTime: 0,
  //  maxSupply: 10,
  //  cutoffSupply: 0,
  //  maxMintablePerAccount: 2,
  //  flags: 0
  //}, { gasLimit: 3_000_000 });
  //const receipt = await tx.wait();
  //console.log(receipt);

  if (chainId !== 1337 && process.env.VERIFY_ETHERSCAN) {

    // Verify everything on etherscan (wait 30 sec for polygonscan to process it first)
    console.log('\nWaiting for polygonscan to index the bytecode...');
    await new Promise((res) => setTimeout(res, 30_000));

    //await hre.run('etherscan-verify')

    try {
      await hre.run('verify:verify', {
        address: rarementCreator.address,
        constructorArguments: [rarementCreatorImp.address, deployer.address, '0x8129fc1c'],
        contract: 'contracts/RarementCreatorProxy.sol:RarementCreatorProxy'
      });
      console.log(`[RarementCreator(proxy)] was verified.`);
    } catch (e) {
      console.log(`[RarementCreator(proxy)] ${e}`);
    }

    try {
      await hre.run('verify:verify', {
        address: rarementCreatorImp.address
      });
      console.log(`[RarementCreator(implementation)] was verfied.`);
    } catch (e) {
      console.log(`[RarementCreator(implementation)] ${e}`);
    }

    try {
      await hre.run('verify:verify', {
        address: beaconAddress,
        constructorArguments: [rarementImplAddr]
      });
      console.log(`[RarementCreator.beaconAddress] was verified.`);
    } catch (e) {
      console.log(`[RarementCreator.beaconAddress] ${e}`);
    }

    try {
      await hre.run('verify:verify', {
        address: rarementImplAddr
      });
      console.log(`[Rarement(implementation)] was verified.`);
    } catch (e) {
      console.log(`[Rarement(implementation)] ${e}`);
    }
  }
};
export default func;