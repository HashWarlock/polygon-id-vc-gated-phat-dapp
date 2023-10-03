//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Phat Rollup Anchor to get off-chain data with custom logic via Phat Contract
import "./PhatRollupAnchor.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Counter is PhatRollupAnchor, Ownable {
    uint256 currentCount = 0;
    string currentQuote = "We out here! :P";
    mapping(uint => string) requests;
    uint nextRequest = 1;

    uint constant TYPE_RESPONSE = 0;
    uint constant TYPE_ERROR = 2;

    event ResponseReceived(uint reqId, uint count, string quote);
    event ErrorReceived(uint reqId, uint count, string error);

    // Set Attestor role to the Phat Contract attestor address in Phat Contract 2.0 dashboard.
    constructor(address _owner) {
        _grantRole(PhatRollupAnchor.ATTESTOR_ROLE, _owner);
    }

    function setAttestor(address phatAttestor) public {
        _grantRole(PhatRollupAnchor.ATTESTOR_ROLE, phatAttestor);
    }

    function increment() public {
        uint id = nextRequest;
        requests[id] = currentQuote;
        _pushMessage(abi.encode(id, currentCount));
        currentCount = currentCount + 1;
        nextRequest += 1;
    }

    function retrieve() public view returns (uint256){
        return currentCount;
    }

    function quote() public view returns (string memory){
        return currentQuote;
    }

    // Function gets API info off-chain to random quote
    function _onMessageReceived(bytes calldata action) internal override {
        // Optional to check length of action
        // require(action.length == 32 * 3, "cannot parse action");
        (uint respType, uint id, string memory _quote) = abi.decode(
            action,
            (uint, uint, string)
        );
        if (respType == TYPE_RESPONSE) {
            emit ResponseReceived(id, id, _quote);
            delete requests[id];
        } else if (respType == TYPE_ERROR) {
            emit ErrorReceived(id, id, "ERROR");
            delete requests[id];
        }

        currentQuote = _quote;
    }
}
