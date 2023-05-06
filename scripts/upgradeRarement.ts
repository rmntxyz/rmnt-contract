import { task } from 'hardhat/config';
import { NETWORK_MAP, API_URI_MAP } from './constant';
import { readJson, writeJson } from './utils';
import fs from 'fs';

task('upgradeRarement', 'Deploy new version of Rarement[VERSION].sol')
  .addPositionalParam('rarementVersion', 'new Rarement version')
  .addOptionalParam('upgradeAddress', 'new Rarement address')
  .setAction(async (args, hre) => {
    const { network, ethers } = hre;
    const chainId = parseInt(await network.provider.send("eth_chainId"));
    const networkName = NETWORK_MAP[chainId];
    const uri = API_URI_MAP[chainId];

    const { rarementVersion, upgradeAddress } = args;

    if(!fs.existsSync(`contracts/Rarement${rarementVersion}.sol`)) {
      return;
    }

    let rarementUpgradeAddress = upgradeAddress;
    const addresses = await readJson('addresses.json');

    if (!rarementUpgradeAddress) {
      console.log(`Start Deployment to ${networkName} (chainId ${chainId})`);

      const RarementFactory = await ethers.getContractFactory(`Rarement${rarementVersion}`);
      const rarementUpgrade = await RarementFactory.deploy();
      const rarementUpgradeReceipt = await rarementUpgrade.deployTransaction.wait();
      rarementUpgradeAddress = rarementUpgradeReceipt.contractAddress;
      console.log(`[Rarement${rarementVersion}]: ${rarementUpgradeAddress}`);

      // verify rarementUpgradeAddress
      if (chainId !== 1337 && process.env.VERIFY_ETHERSCAN) {
        console.log('\nWaiting for polygonscan to index the bytecode...');
        await new Promise((res) => setTimeout(res, 30_000));

        try {
          await hre.run('verify:verify', {
            address: rarementUpgradeAddress 
          });
          console.log(`[RarementCreator(implementation)] was verfied.`);
        } catch (e) {
          console.log(`[RarementCreator(implementation)] ${e}`);
        }
      }
    }

    // upgrade beacon
    const beaconAddress = addresses[networkName]['Beacon'];
    const beacon = await ethers.getContractAt('UpgradeableBeacon', beaconAddress);
    const tx = await beacon.upgradeTo(rarementUpgradeAddress);
    await tx.wait();

    addresses[networkName][`Rarement`] = rarementUpgradeAddress;
    await writeJson(addresses, 'addresses.json')
  });