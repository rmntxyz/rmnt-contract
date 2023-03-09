import { task } from 'hardhat/config';
// import '@openzeppelin/hardhat-upgrades';

task('verifyContract', 'verify contract for Rarement')
  .setAction(async (args, hre) => {
    const { ethers, network } = hre;
    const chainId = parseInt(await network.provider.send("eth_chainId"));

    if (chainId === 1337) {
      return;
    }

    await hre.run('verify:verify');

  });
