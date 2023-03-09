// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/*
   ______    __    __    __   __    ______  
  /\  == \  /\ "-./  \  /\ "-.\ \  /\__  _\ 
  \ \  __<  \ \ \-./\ \ \ \ \-.  \ \/_/\ \/ 
   \ \_\ \_\ \ \_\ \ \_\ \ \_\\"\_\   \ \_\ 
    \/_/ /_/  \/_/  \/_/  \/_/ \/_/    \/_/ 
*/

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC2981Upgradeable, IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

struct RarementInfo {
    // artist ID
    uint128 artistId;
    // name
    string name;
    // symbol
    string symbol;
    // baseURI of metadata
    string baseURI;
    // the account that will receive sales revenue.
    address payable fundingRecipient;
    // the price at which each token will be sold, in ETH.
    uint96 price;
    // the price at which each token will be sold, in ETH, during the pre-sale.
    uint96 presalePrice;
    // royalty
    uint16 royaltyBPS;
    // presale start timestamp before public sale
    uint32 presaleStartTime;
    // start timestamp of auction (in seconds since unix epoch)
    uint32 startTime;
    // end timestamp of auction (in seconds since unix epoch)
    uint32 endTime;
    // maximum supply
    uint32 maxSupply;
    // minimum supply for cutoff
    uint32 cutoffSupply;
    // maximum number of minting per account
    uint32 maxMintablePerAccount;
    // boolean options
    uint8 flags;
}

contract RarementV2 is
    Initializable,
    ERC721Upgradeable,
    IERC2981Upgradeable,
    OwnableUpgradeable
{
    // =============================================================
    //                           CONSTANTS
    // =============================================================

    // boolean flag on whether the 'random mint' is enabled.
    uint8 public constant RANDOM_MINT_ENABLED_FLAG = 1 << 0;

    // boolean flag on whether the 'presale' is enabled.
    uint8 public constant PRESALE_ENABLED_FLAG = 1 << 1;

    // boolean flag on whether the 'cutoff supply' is enabled.
    uint8 public constant CUTOFF_SUPPLY_ENABLED_FLAG = 1 << 1;

    // =============================================================
    //                            STORAGE
    // =============================================================

    // rarement ID
    uint128 rarementId;

    // rarement info data
    RarementInfo internal info;

    // for proof of presale eligibility
    bytes32 public merkleRoot;

    // mapping to check for empty tokens
    mapping(uint32 => uint32) private availableTokens;

    // number of available tokens
    uint32 private numAvailableTokens;

    // =============================================================
    //                            EVENTS
    // =============================================================

    event MerkleRootSet(
        uint128 indexed rarementId,
        uint128 indexed artistId,
        bytes32 merkleRoot
    );

    event Presold(
        uint128 indexed rarementId,
        uint128 indexed artistId,
        address indexed buyer,
        uint32[] tokenId,
        uint32 minted
    );

    event Minted(
        uint128 indexed rarementId,
        uint128 indexed artistId,
        address indexed buyer,
        uint32[] tokenId,
        uint32 minted
    );

    event Airdropped(
        uint128 indexed rarementId,
        uint128 indexed artistId,
        address[] to,
        uint32 quantity,
        uint32 minted
    );

    // =============================================================
    //               PUBLIC / EXTERNAL WRITE FUNCTIONS
    // =============================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address,
        uint128 id,
        RarementInfo calldata rarementData
    ) public initializer {
        __ERC721_init(rarementData.name, rarementData.symbol);
        __Ownable_init();

        rarementId = id;
        numAvailableTokens = rarementData.maxSupply;
        info = rarementData;
    }

    function setPresaleStartTime(uint32 timestamp) external onlyOwner {
        info.presaleStartTime = timestamp;
    }

    function setStartTime(uint32 startTime) external onlyOwner {
        info.startTime = startTime;
    }

    function setEndTime(uint32 endTime) external onlyOwner {
        info.endTime = endTime;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        info.baseURI = baseURI;
    }

    function setMerkleRoot(bytes32 merkleRootHash) public onlyOwner {
        require(merkleRootHash != bytes32(0), "Merkle root hash is empty.");

        merkleRoot = merkleRootHash;

        emit MerkleRootSet(rarementId, info.artistId, merkleRootHash);
    }

    function totalSupply() public view virtual returns (uint32) {
        return info.maxSupply - numAvailableTokens;
    }

    function maxSupply() public view virtual returns (uint32) {
        return info.maxSupply;
    }

    function airdrop(address[] calldata to, uint32 quantity)
        external
        onlyOwner
    {
        require(to.length > 0, "No address to airdrop");

        require(
            to.length * quantity <= numAvailableTokens,
            "ERC721: minting more tokens than available"
        );

        // Won't overflow, as `to.length` is bounded by the block max gas limit.
        unchecked {
            uint256 toLength = to.length;
            // Mint the tokens. Will revert if `quantity` is zero.
            for (uint256 i; i != toLength; ++i) {
                _mintRarement(to[i], 0, quantity);
            }
        }

        emit Airdropped(rarementId, info.artistId, to, quantity, totalSupply());
    }

    function presale(uint32 quantity, bytes32[] calldata merkleProof)
        external
        payable
    {
        // Don't allow presale unless presale enabled flag is set
        require(
            info.flags & PRESALE_ENABLED_FLAG != 0,
            "Presale is not available."
        );

        // Don't allow purchases before the presale start time
        require(
            info.presaleStartTime < block.timestamp,
            "Presale hasn't started"
        );

        // Don't allow purchases after the end(=public mint start) time
        require(info.startTime > block.timestamp, "Presale has ended");

        bytes32 node = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(merkleProof, merkleRoot, node),
            "invalid proof"
        );

        // Mint a new token for the sender
        uint32[] memory tokenIds = _mintRarement(
            msg.sender,
            quantity,
            info.presalePrice
        );

        emit Presold(
            rarementId,
            info.artistId,
            msg.sender,
            tokenIds,
            totalSupply()
        );
    }

    function mint(uint32 quantity) external payable {
        // Don't allow purchases before the start time
        require(info.startTime < block.timestamp, "Auction hasn't started");

        // Don't allow purchases after the end time
        require(
            _isBelowCutoffSupply() || info.endTime > block.timestamp,
            "Auction has ended"
        );

        // Mint a new token for the sender
        uint32[] memory tokenIds = _mintRarement(
            msg.sender,
            quantity,
            info.price
        );

        emit Minted(
            rarementId,
            info.artistId,
            msg.sender,
            tokenIds,
            totalSupply()
        );
    }

    function withdrawETH() public payable onlyOwner {
        (bool success, ) = payable(info.fundingRecipient).call{
            value: address(this).balance
        }("");

        require(success, "Unable to send value: recipient may have reverted");
    }

    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        override
        returns (address recepient, uint256 royalty)
    {
        if (info.fundingRecipient == address(0x0)) {
            return (info.fundingRecipient, 0);
        }

        return (
            info.fundingRecipient,
            (salePrice * uint256(info.royaltyBPS)) / 10_000
        );
    }

    function rarementInfo() external view returns (RarementInfo memory) {
        return info;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, IERC165Upgradeable)
        returns (bool)
    {
        return
            type(IERC2981Upgradeable).interfaceId == interfaceId ||
            super.supportsInterface(interfaceId);
    }

    // =============================================================
    //                  INTERNAL / PRIVATE HELPERS
    // =============================================================

    function _baseURI() internal view override returns (string memory) {
        return info.baseURI;
    }

    function _isBelowCutoffSupply() internal view returns (bool) {
        return
            info.flags & CUTOFF_SUPPLY_ENABLED_FLAG != 0 &&
            info.cutoffSupply > totalSupply();
    }

    function _mintRarement(
        address to,
        uint32 quantity,
        uint96 price
    ) internal virtual returns (uint32[] memory) {
        require(to != address(0), "ERC721: mint to the zero address");

        require(quantity > 0, "ERC721: need to mint at least one token");

        // Check how many the sender has.
        require(
            balanceOf(msg.sender) + quantity <= info.maxMintablePerAccount,
            "Exceed the rarement holding limit per wallet"
        );

        // Check that the sender is paying the correct amount.
        require(
            msg.value >= price * quantity,
            "Must send enough to purchase the rarement"
        );

        // TODO: Probably don't need this as it will underflow and revert automatically in this case
        require(
            quantity <= numAvailableTokens,
            "ERC721: minting more tokens than available"
        );

        uint32[] memory tokenIds = new uint32[](quantity);

        uint32 updatedNumAvailableTokens = numAvailableTokens;

        unchecked {
            for (uint32 i; i < quantity; ++i) {
                uint32 tokenId;

                if (info.flags & RANDOM_MINT_ENABLED_FLAG != 0) {
                    tokenId = _getRandomAvailableTokenId(
                        to,
                        updatedNumAvailableTokens
                    );
                } else {
                    tokenId = _getAvailableTokenAtIndex(
                        info.maxSupply - updatedNumAvailableTokens,
                        numAvailableTokens
                    );
                }

                _mint(to, tokenId);
                tokenIds[i] = tokenId;

                --updatedNumAvailableTokens;
            }
        }

        numAvailableTokens = updatedNumAvailableTokens;

        return tokenIds;
    }

    function _getRandomAvailableTokenId(
        address to,
        uint32 updatedNumAvailableTokens
    ) internal returns (uint32) {
        uint256 randomNum = uint256(
            keccak256(
                abi.encode(
                    to,
                    tx.gasprice,
                    block.number,
                    block.timestamp,
                    block.difficulty,
                    blockhash(block.number - 1),
                    address(this),
                    updatedNumAvailableTokens
                )
            )
        );
        uint32 randomIndex = uint32(randomNum) % updatedNumAvailableTokens;
        return
            _getAvailableTokenAtIndex(randomIndex, updatedNumAvailableTokens);
    }

    // Implements https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle.
    function _getAvailableTokenAtIndex(
        uint32 indexToUse,
        uint32 updatedNumAvailableTokens
    ) internal returns (uint32) {
        uint32 valAtIndex = availableTokens[indexToUse];
        uint32 result;
        if (valAtIndex == 0) {
            // This means the index itself is still an available token
            result = indexToUse;
        } else {
            // This means the index itself is not an available token, but the val at that index is.
            result = valAtIndex;
        }

        uint32 lastIndex = updatedNumAvailableTokens - 1;
        uint32 lastValInArray = availableTokens[lastIndex];
        if (indexToUse != lastIndex) {
            // Replace the value at indexToUse, now that it's been used.
            // Replace it with the data from the last index in the array, since we are going to decrease the array size afterwards.
            if (lastValInArray == 0) {
                // This means the index itself is still an available token
                availableTokens[indexToUse] = lastIndex;
            } else {
                // This means the index itself is not an available token, but the val at that index is.
                availableTokens[indexToUse] = lastValInArray;
            }
        }
        if (lastValInArray != 0) {
            // Gas refund courtsey of @dievardump
            delete availableTokens[lastIndex];
        }

        return result;
    }

    function version() public pure returns (string memory) {
        return "V2";
    }
}
