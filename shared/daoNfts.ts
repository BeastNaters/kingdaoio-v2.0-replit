/**
 * DAO-owned NFT Collections
 * 
 * This file contains static data for NFT collections held by KingDAO.
 * In the future, this could be dynamically loaded from Supabase or fetched
 * from on-chain data via Moralis/Dune Analytics.
 */

export interface DaoNftCollection {
  name: string;
  description: string;
  contractAddress: string;
  tokenIds: number[];
  links: {
    etherscan: string;
    opensea?: string;
  };
}

export const daoNftCollections: DaoNftCollection[] = [
  {
    name: "Rollbots",
    description: "Core Rollbit ecosystem collection held by the DAO.",
    contractAddress: "0x2f102e69cbce4938cf7fb27adb40fad097a13668",
    tokenIds: [
      4814, 1663, 1398, 5370, 9037, 2924, 8499, 8254, 2512, 1011,
      5663, 1904, 8623, 5847, 7841, 2771, 2474, 3802, 4669, 3220,
      4965, 9338, 9492, 9876, 1518, 3650, 793, 9282, 6173, 1517,
      7088, 3020, 7823, 7727, 4068, 4986, 1181, 2917, 6681, 6245,
      9042, 5443, 2921, 2461, 4067, 2840, 5987, 1594, 8459, 2981,
      2472, 4108, 1338, 9249, 6260, 2716, 539, 4635, 2606, 5181,
      2670, 6154, 5152, 2534, 9231, 6495, 4624, 6450, 3335, 3917,
      3539, 2912, 6411, 2813, 8682, 8342, 3242
    ],
    links: {
      etherscan: "https://etherscan.io/token/0x2f102e69cbce4938cf7fb27adb40fad097a13668",
      opensea: "https://opensea.io/assets/ethereum/0x2f102e69cbce4938cf7fb27adb40fad097a13668"
    }
  },
  {
    name: "Sports Rollbots",
    description: "Sports-focused Rollbots owned by the DAO.",
    contractAddress: "0x1de7abda2d73a01aa8dca505bdcb773841211daf",
    tokenIds: [
      6980, 5852, 7644, 6766, 6935, 3794, 1678, 195, 1084, 1504,
      3197, 282, 7271, 6352, 6056, 209, 1048, 7575, 5250, 8916,
      2260, 9979, 2343, 4223, 4650, 4077
    ],
    links: {
      etherscan: "https://etherscan.io/token/0x1de7abda2d73a01aa8dca505bdcb773841211daf"
    }
  },
  {
    name: "KING",
    description: "Kong NFTs used for token-gated access in the DAO.",
    contractAddress: "0x6E3a2e08A88186f41ECD90E0683d9cA0983a4328",
    tokenIds: [267, 771, 73, 164, 218],
    links: {
      etherscan: "https://etherscan.io/token/0x6E3a2e08A88186f41ECD90E0683d9cA0983a4328",
      opensea: "https://opensea.io/collection/konginvestment"
    }
  }
];
