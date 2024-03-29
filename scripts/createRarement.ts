import { task } from 'hardhat/config';
import { readJson } from './utils';
import { NETWORK_MAP, API_URI_MAP, API_ACCESS_TOKEN_MAP } from './constant';
import axios from 'axios';

task('createRarement', 'Calls createRarement on RarementCreator.sol')
  .addPositionalParam('rarementName', 'Configuration file name for Rarement initialization')
  .addOptionalParam('artistId', 'Artist ID')
  .addOptionalParam('webtoonId', 'Webtoon ID')
  .addOptionalParam('collectibleId', 'Collectible ID')
  .setAction(async (args, hardhat) => {
    let { rarementName, artistId, webtoonId, collectibleId } = args;
    const { network, ethers } = hardhat;
    const chainId = parseInt(await network.provider.send("eth_chainId"));
    const networkName = NETWORK_MAP[chainId];
    const uri = API_URI_MAP[chainId];

    if (artistId) {
      console.log(`ARTIST ID: ${artistId}`);
    } else {
      artistId = null;
    }

    if (webtoonId) {
      console.log(`WEBTOON ID: ${webtoonId}`);
    } else {
      webtoonId = null;
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

    const eventData = rarementCreator.interface.parseLog(receipt.events[4]);
    const { rarementId, rarementAddress } = eventData.args;

    let rid = rarementId.toNumber();
    if (chainId === 80001) {
      rid += 1000000
    }

    console.log(`RAREMENT ID: ${rid}`);
    console.log(`RAREMENT ADDRESS: ${rarementAddress}`);

    //const rid = 1;
    //const rarementAddress = "0x3Be6836e984b0735cbef9256ec3d567880506c8A";

    const data = {
      ...config,
      contractAddress: rarementAddress,
      rarementId: rid,
      artistId,
      webtoonId,
      collectibleId,
      chainId
    }

    const res = await axios.post(`${uri}/rarements`, { data }, {
      headers: {
        Authorization: `Bearer ${API_ACCESS_TOKEN_MAP[chainId]}`,
      }
    });
  });