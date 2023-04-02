import { task } from 'hardhat/config';
// import '@openzeppelin/hardhat-upgrades';

task('upgradeBeacon', 'Calls upgradeTo on an UpgradeableBeacon that points to Rarement.sol implementation)')
  .addParam('beaconAddress', 'The address of the beacon contract')
  .addParam('newImplementation', 'The address of the new Artist.sol implementation')
  .setAction(async (args, hardhat) => {
    
    //const { beaconAddress, newImplementation } = args;
    //const { network, ethers } = hardhat;

    //console.log(`Upgrading the beacon implementation to ${newImplementation} on ${network.name}`);
    //const [deployer] = await ethers.getSigners();

    //const beacon = await ethers.getContractAt('UpgradeableBeacon', beaconAddress, deployer);
    //const currentOwner = await beacon.owner();
    //const currentImplementation = await beacon.implementation();
    //console.log({ currentOwner, currentImplementation });

    //if (currentOwner !== deployer.address) {
    //  throw new Error(`The beacon is not owned by the deployer`);
    //}
    //const tx = await beacon.upgradeTo(newImplementation);
    //console.log('transaction started:', tx.hash);
    //await tx.wait();

    //const expectedImplementation = await beacon.implementation();
    //if (expectedImplementation.toLowerCase() !== newImplementation.toLowerCase()) {
    //  throw new Error(`The beacon implementation was not upgraded to ${newImplementation}`);
    //} else {
    //  console.log(`Beacon implementation upgraded to ${newImplementation}`);
    //}
  });