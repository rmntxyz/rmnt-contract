import { task } from 'hardhat/config';
import fs from 'fs/promises';

const readJson = async () => {
  let data = await fs.readFile('addresses.json');
  return JSON.parse(data.toString());
}


task('createRarement', 'Calls createRarement on RarementCreator.sol')
  // .addParam('config', 'Configuration file name for Rarement initialization')
  .setAction(async (args, hardhat) => {
    const { config } = args;
    const { network, ethers } = hardhat;
    const [deployer] = await ethers.getSigners();

    console.log(await readJson())
    const rarementCreator = await ethers.getContract('RarementCreator', deployer);
    console.log(rarementCreator.address);
    //const beaconAddress = await rarementCreator.beaconAddress();
    //console.log(`[RarementCreator.beaconAddress]: ${beaconAddress}`);
  
    //const beacon = await ethers.getContractAt('UpgradeableBeacon', beaconAddress);
    //const rarementImplAddr = await beacon.implementation();
    //console.log(`[Rarement(implementation)]: ${rarementImplAddr}`);
  });