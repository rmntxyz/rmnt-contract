import { task } from 'hardhat/config';
import { readJson } from './utils';
import { NETWORK_MAP, API_URI_MAP, API_ACCESS_TOKEN_MAP } from './constant';
import axios from 'axios';

task('createRarement', 'Calls createRarement on RarementCreator.sol')
  .addPositionalParam('rarementName', 'Configuration file name for Rarement initialization')
  .addOptionalParam('avatarId', 'Avatar ID')
  .addOptionalParam('collectibleId', 'Collectible ID')
  .setAction(async (args, hardhat) => {
    let { rarementName, avatarId, collectibleId } = args;
    const { network, ethers } = hardhat;
    const chainId = parseInt(await network.provider.send("eth_chainId"));
    const networkName = NETWORK_MAP[chainId];
    const uri = API_URI_MAP[chainId];

    if (avatarId) {
      console.log(`AVARTAR ID: ${avatarId}`);
    } else {
      avatarId = null;
    }

    if (collectibleId) {
      console.log(`COLLECTIBLE ID: ${collectibleId}`);
    } else {
      collectibleId = null;
    }

    const config = await readJson(`rarements/${rarementName}.json`);
    console.log(`CONFIG:\n${JSON.stringify(config, undefined, 2)}\n`)

    const addresses = await readJson('addresses.json');
    const rarementCreatorAddress = addresses[networkName]['RarementCreator'];

    const rarementCreator = await ethers.getContractAt('RarementCreator', rarementCreatorAddress);
    const tx = await rarementCreator.createRarement(config);
    const receipt = await tx.wait();
    const eventData = rarementCreator.interface.parseLog(receipt.events[3]);
    const { rarementId, rarementAddress } = eventData.args;
    console.log(`RAREMENT ID: ${rarementId}`);
    console.log(`RAREMENT ADDRESS: ${rarementAddress}`);

    const data = {
        ...config,
        contractAddress: rarementAddress,
        rarementId: rarementId.toNumber(),
        avatarId,
        collectibleId
    }

    const res = await axios.post(`${uri}/rarements`, { data }, {
      headers: {
        Authorization: `Bearer ${API_ACCESS_TOKEN_MAP[chainId]}`,
      }
    });
  });