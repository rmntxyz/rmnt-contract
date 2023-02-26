// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/*
   ______    __    __    __   __    ______  
  /\  == \  /\ "-./  \  /\ "-.\ \  /\__  _\ 
  \ \  __<  \ \ \-./\ \ \ \ \-.  \ \/_/\ \/ 
   \ \_\ \_\ \ \_\ \ \_\ \ \_\\"\_\   \ \_\ 
    \/_/ /_/  \/_/  \/_/  \/_/ \/_/    \/_/ 
*/

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract RarementCreatorProxy is ERC1967Proxy {
    constructor(
        address _logic,
        address _dummy,
        bytes memory _data
    ) payable ERC1967Proxy(_logic, _data) {}
}
