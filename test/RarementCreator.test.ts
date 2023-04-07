import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";

const { provider } = ethers;

const now = () => Math.floor(Date.now() / 1000);
const ONE_HOUR = 3600; 

describe('RarementCreator', () => {
  let RarementCreator: ContractFactory;
  let Rarement: ContractFactory;
  let RarementV2: ContractFactory;

  let rarementCreator: Contract;

  let rmntOwner: SignerWithAddress;
  let artist1: SignerWithAddress;
  let artist2: SignerWithAddress;
  let buyers: SignerWithAddress[];

  const startTime = now();
  const dummyArgsForRarementInit = {
    name: "Rarement",
    symbol: "RMNT",
    baseURI: "https://rmnt.xyz/metadata/",
    fundingRecipient: "0x2526665483520C28765917d63a7E1af89Bf3Fd15", 
    presalePrice: 0,
    presaleStartTime: 0,
    price: 0,
    royaltyBPS: 200, // bps - 200 == 0.02 of 1 == 2%
    startTime: 0,
    endTime: 0,
    maxSupply: 10,
    cutoffSupply: 0,
    maxMintablePerAccount: 2,
    flags: 0
  };

  before(async () => {
    const signers = await ethers.getSigners();
    rmntOwner = signers[0];
    artist1 = signers[1];
    artist2 = signers[2];
    buyers = signers.slice(3);
    

    Rarement = await ethers.getContractFactory('Rarement');

    RarementV2 = await ethers.getContractFactory('RarementV2');

    RarementCreator = await ethers.getContractFactory('RarementCreator');
    // rarementCreator = await upgrades.deployProxy(RarementCreator, { kind: 'uups' });
    //rarementCreator = await RarementCreator.deploy();

    const deployResult = await deployments.deploy('RarementCreator', {
      from: rmntOwner.address,
      log: true,
      proxy: {
        owner: rmntOwner.address,
        proxyContract: 'RarementCreatorProxy',
        // proxyContract: 'UUPS',
        execute: {
          methodName: 'initialize',
          args: [],
        },
      }
    });  
    console.log(`[RarementCreator(proxy)]: ${deployResult.address}`);
  
    const rarementCreatorImp = await ethers.getContract('RarementCreator_Implementation', rmntOwner);
    console.log(`[RarementCreator(implementation)]: ${rarementCreatorImp.address}`);
  
    rarementCreator = await ethers.getContractAt('RarementCreator', deployResult.address);
    const beaconAddress = await rarementCreator.beaconAddress();
    console.log(`[RarementCreator.beaconAddress]: ${beaconAddress}`);
  
    const beacon = await ethers.getContractAt('UpgradeableBeacon', beaconAddress);
    const rarementImplAddr = await beacon.implementation();
    console.log(`[Rarement(implementation)]: ${rarementImplAddr}`);

    //const beacon = await upgrades.deployBeacon(Rarement);
    //await beacon.deployed();

    //const rarement = await upgrades.deployBeaconProxy(beacon, Rarement, [rmntOwner.address, 0, dummyArgsForRarementInit]);
    //await rarement.deployed();

    //const rarementCreatorImpl = await RarementCreator.attach(rarementCreator.address);
    //rarementCreatorImpl.setBeaconAddress(beacon.address);
  });

  it('deploys', async () => {
    const deployedByteCode = await provider.getCode(rarementCreator.address);
    expect(deployedByteCode).to.not.be.null;
  });

  it('create Rarement', async () => {
    const startTime = now();

    const tx = await rarementCreator.createRarement({
      name: "Tango Volume1",
      symbol: "TNGV1",
      baseURI: "ipfs://QmWHvbuHaMf8UekwHMvWS21M7Tt3ZSRZDAgJTNmxYXhSY3/",
      fundingRecipient: artist1.address, 
      royaltyBPS: 200, // bps - 200 == 0.02 of 1 == 2%
      presalePrice: 0,
      presaleStartTime: 0,
      price: parseEther('0.0003'),
      startTime,
      endTime: startTime + ONE_HOUR,
      maxSupply: 10,
      cutoffSupply: 0,
      maxMintablePerAccount: 2,
      flags: 0 // no random, no presale, no cutoffSupply
    });
    const receipt = await tx.wait();
    const eventData = rarementCreator.interface.parseLog(receipt.events[3]);
    const { rarementAddress } = eventData.args;
    const r = Rarement.attach(rarementAddress); 

    expect(await rarementCreator.getCurrentCount()).to.equal(1);
    expect(r.version).to.be.undefined;
  });

  it('upgrade Rarement', async () => {
    const rarementV2 = await RarementV2.deploy();
    await rarementV2.deployed();

    const beaconAddress = await rarementCreator.beaconAddress();
    const beaconContract = await ethers.getContractAt('UpgradeableBeacon', beaconAddress, rmntOwner);
    const beaconTx = await beaconContract.upgradeTo(rarementV2.address);
    await beaconTx.wait();

    const startTime = now();
    const tx = await rarementCreator.createRarement({
      name: "Tango Volume2",
      symbol: "TNGV2",
      baseURI: "ipfs://QmWHvbuHaMf8UekwHMvWS21M7Tt3ZSRZDAgJTNmxYXhSY3/",
      fundingRecipient: "0xaD7863dA4f4eef797AA5Dc27997349866320F272", // 0xsplits - goerli network
      royaltyBPS: 200,  // bps - 200 == 0.02 of 1 == 2%
      price: parseEther('0.0001'),
      presalePrice: 0,
      presaleStartTime: 0,
      startTime,
      endTime: startTime + ONE_HOUR,
      maxSupply: 100,
      cutoffSupply: 0,
      maxMintablePerAccount: 3,
      flags: 1
    });
    const receipt = await tx.wait();
    const eventData = rarementCreator.interface.parseLog(receipt.events[3]);
    const { rarementAddress } = eventData.args;
    const rv2 = RarementV2.attach(rarementAddress);

    expect(await rarementCreator.getCurrentCount()).to.equal(2);
    expect(await rv2.version()).to.equal("V2");
    expect(await rv2.maxSupply()).to.equal(100);
  })

  describe('Rarement', () => {
    let buyer1: SignerWithAddress,
        buyer2: SignerWithAddress,
        buyer3: SignerWithAddress;
      
    let rarement: Contract;

    before(async () => {
      [buyer1, buyer2, buyer3] = buyers; 

      const addr = await rarementCreator.rarementContracts(1);
      rarement = Rarement.attach(addr); 
    })

    it('mint form deployed Rarement', async () => {
      const preBalance = await buyer1.getBalance();

      const tx = await rarement.connect(buyer1).mint(2, {
        value: parseEther('0.0003').mul(2)
      });
      await tx.wait();
      // const receipt = await tx.wait();
      // const eventDatas = receipt.events.filter(d => d.event === 'RarementMinted');
      const postBalance = await buyer1.getBalance();

      expect(postBalance).lessThan(preBalance);
    })

    it('exceed mint limit', async () => {
      await expect(rarement.connect(buyer1).mint(3, {
        value: parseEther('0.0003').mul(2)
      })).to.be.revertedWith('Exceed the rarement holding limit per wallet');
    })
  });
});
