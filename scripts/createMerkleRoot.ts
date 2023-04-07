import { task } from 'hardhat/config';
import { MerkleTree } from 'merkletreejs';

task('createMerkleRoot', 'create MerkleTree and get MerkleRoot')
  .setAction(async (args, hre) => {
    const { ethers, network } = hre;
    const { keccak256 } = ethers.utils;
    // 주어진 주소들
    const transactions = [
      '0x2526665483520C28765917d63a7E1af89Bf3Fd15',
      '0x5067c0e3Bb32f42EF11d2246f201f26a917e7993',
      '0x5fe40Fea285186400d16bd7BB449c0F50a0d39cE',
      '0x2092339bceB9f028A1CEB1c6526B547D4284C1da',
      '0x8Aac2fB64F6346558024C8f5c76cc900c1454c74'
    ];

    // Keccak-256 해시 함수를 이용해 각 주소를 해싱한 후 leaves 배열로 만듦
    const leaves = transactions.map(tx => keccak256(tx));

    // Merkle Tree 생성
    const tree = new MerkleTree(leaves, keccak256, { sort: true });

    // Merkle Root 구하기
    const root = tree.getRoot().toString('hex');
    console.log(`Merkle Root: ${root}`);

    const index = 1; // 증명하려는 트랜잭션의 인덱스
    const proof = tree.getHexProof(leaves[index]);
    console.log(`Proof: ${proof}`);
  });