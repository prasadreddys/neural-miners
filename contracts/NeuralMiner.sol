// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NeuralMiner is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    mapping(address => uint256) public tokensEarned;

    event AssetMinted(address indexed user, uint256 tokenId, string metadata);
    event TokenRewarded(address indexed user, uint256 amount);

    constructor() ERC721("NeuralMinerAsset", "NMINER") {}

    function mint(address to, uint256 tokenId, string memory metadata) external onlyOwner returns (bool) {
        _mint(to, tokenId);
        _setTokenURI(tokenId, metadata);
        emit AssetMinted(to, tokenId, metadata);
        return true;
    }

    function rewardToken(address to, uint256 amount) external onlyOwner {
        tokensEarned[to] += amount;
        emit TokenRewarded(to, amount);
    }

    function getOnchainAchievements(address account) external view returns (uint256) {
        return tokensEarned[account];
    }
}
