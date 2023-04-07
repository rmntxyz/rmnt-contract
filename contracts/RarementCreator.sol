// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/*
   ______    __    __    __   __    ______  
  /\  == \  /\ "-./  \  /\ "-.\ \  /\__  _\ 
  \ \  __<  \ \ \-./\ \ \ \ \-.  \ \/_/\ \/ 
   \ \_\ \_\ \ \_\ \ \_\ \ \_\\"\_\   \ \_\ 
    \/_/ /_/  \/_/  \/_/  \/_/ \/_/    \/_/ 
*/

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {Rarement, RarementInfo} from "./Rarement.sol";

contract RarementCreator is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // =============================================================
    //                            STORAGE
    // =============================================================

    // counter
    CountersUpgradeable.Counter private numRarements;
    // beacon address
    address public beaconAddress;
    // registry of created contracts
    address[] public rarementContracts;

    // =============================================================
    //                            EVENTS
    // =============================================================

    // emitted when an Rarement is created
    event RarementCreated(
        uint256 indexed rarementId,
        RarementInfo info,
        address indexed rarementAddress
    );

    // =============================================================
    //               PUBLIC / EXTERNAL WRITE FUNCTIONS
    // =============================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();

        // set up beacon with msg.sender as the owner
        UpgradeableBeacon _beacon = new UpgradeableBeacon(
            address(new Rarement())
        );
        _beacon.transferOwnership(msg.sender);

        beaconAddress = address(_beacon);
    }

    function createRarement(RarementInfo memory info)
        public
        onlyOwner
        returns (address)
    {
        uint256 rarementId = numRarements.current();
        BeaconProxy proxy = new BeaconProxy(
            beaconAddress,
            abi.encodeWithSelector(
                Rarement(address(0)).initialize.selector,
                msg.sender,
                rarementId,
                info
            )
        );

        rarementContracts.push(address(proxy));

        emit RarementCreated(rarementId, info, address(proxy));

        numRarements.increment();

        return address(proxy);
    }

    function getCurrentCount() public view returns (uint256) {
        return numRarements.current();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
