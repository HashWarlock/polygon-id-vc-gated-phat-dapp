// *** YOU ARE LIMITED TO THE FOLLOWING IMPORTS TO BUILD YOUR PHAT CONTRACT     ***
// *** ADDING ANY IMPORTS WILL RESULT IN ERRORS & UPLOADING YOUR CODE TO PHALA  ***
// *** NETWORK WILL FAIL. IF YOU WANT TO KNOW MORE, JOIN OUR DISCORD TO SPEAK   ***
// *** WITH THE PHALA TEAM AT https://discord.gg/5HfmWQNX THANK YOU             ***
import "@phala/pink-env";
import { Coders } from "@phala/ethers";

type HexString = `0x${string}`

// ETH ABI Coders available
/*
// Basic Types
// Encode uint
const uintCoder = new Coders.NumberCoder(32, false, "uint256");
// Encode Bytes
const bytesCoder = new Coders.BytesCoder("bytes");
// Encode String
const stringCoder = new Coders.StringCoder("string");
// Encode Address
const addressCoder = new Coders.AddressCoder("address");

// ARRAYS
//
// ***NOTE***
// IF YOU DEFINE AN TYPED ARRAY FOR ENCODING, YOU MUST ALSO DEFINE THE SIZE WHEN DECODING THE ACTION REPLY IN YOUR
// SOLIDITY SMART CONTRACT.
// EXAMPLE for an array of string with a length of 10
//
// index.ts
const stringCoder = new Coders.StringCoder("string");
const stringArrayCoder = new Coders.ArrayCoder(stringCoder, 10, "string[]");
function encodeReply(reply: [number, number, string[]]): HexString {
  return Coders.encode([uintCoder, uintCoder, stringArrayCoder], reply) as HexString;
}

const stringArray = string[10];

export default function main(request: HexString, settings: string): HexString {
  return encodeReply([0, 1, stringArray]);
}
// OracleConsumerContract.sol
function _onMessageReceived(bytes calldata action) internal override {
    (uint respType, uint id, string[10] memory data) = abi.decode(
        action,
        (uint, uint, string[10])
    );
}
// Encode Array of addresses with a length of 10
const stringArrayCoder = new Coders.ArrayCoder(stringCoder, 10, "string");
// Encode Array of addresses with a length of 10
const addressArrayCoder = new Coders.ArrayCoder(addressCoder, 10, "address");
// Encode Array of bytes with a length of 10
const bytesArrayCoder = new Coders.ArrayCoder(bytesCoder, 10, "bytes");
// Encode Array of uint with a length of 10
const uintArrayCoder = new Coders.ArrayCoder(uintCoder, 10, "uint256");
 */

// eth abi coder
const uintCoder = new Coders.NumberCoder(32, false, "uint256");
const bytesCoder = new Coders.BytesCoder("bytes");
const stringCoder = new Coders.StringCoder("string");

function encodeReply(reply: [number, number, string]): HexString {
  return Coders.encode([uintCoder, uintCoder, stringCoder], reply) as HexString;
}

// Defined in TestLensOracle.sol
const TYPE_RESPONSE = 0;
const TYPE_ERROR = 2;

enum Error {
  BadLensProfileId = "BadLensProfileId",
  FailedToFetchData = "FailedToFetchData",
  FailedToDecode = "FailedToDecode",
  MalformedRequest = "MalformedRequest",
}

function errorToCode(error: Error): number {
  switch (error) {
    case Error.BadLensProfileId:
      return 1;
    case Error.FailedToFetchData:
      return 2;
    case Error.FailedToDecode:
      return 3;
    case Error.MalformedRequest:
      return 4;
    default:
      return 0;
  }
}

function isHexString(str: string): boolean {
  const regex = /^0x[0-9a-f]+$/;
  return regex.test(str.toLowerCase());
}

function stringToHex(str: string): string {
  var hex = "";
  for (var i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  return "0x" + hex;
}

function parseProfileId(hexx: string): string {
  var hex = hexx.toString();
  if (!isHexString(hex)) {
    throw Error.BadLensProfileId;
  }
  hex = hex.slice(2);
  var str = "";
  for (var i = 0; i < hex.length; i += 2) {
    const ch = String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
    str += ch;
  }
  return str;
}

function fetchQuote() {
  let headers = {
    "Content-Type": "application/json",
    "User-Agent": "phat-contract",
  };
  const response = pink.httpRequest({
    url: 'https://api.quotable.io/random',
    method: "GET",
    headers,
    returnTextBody: true,
  });
  console.info(response);
  if (response.statusCode !== 200) {
    console.log(
        `Fail to read Lens api with status code: ${response.statusCode}, error: ${
            response.body
        }}`
    );
    throw Error.FailedToFetchData;
  }
  let respBody = response.body;

  if (typeof respBody !== "string") {
    throw Error.FailedToDecode;
  }
  return JSON.parse(respBody);
}


//
// Here is what you need to implemented for Phat Function, you can customize your logic with
// JavaScript here.
//
// The function will be called with two parameters:
//
// - request: The raw payload from the contract call `request` (check the `request` function in TestLensApiConsumerConract.sol).
//            In this example, it's a tuple of two elements: [requestId, profileId]
// - settings: The custom settings you set with the `config_core` function of the Action Offchain Rollup Phat Contract. In
//            this example, it just a simple text of the lens api url prefix.
//
// Your returns value MUST be a hex string, and it will send to your contract directly. Check the `_onMessageReceived` function in
// TestLensApiConsumerContract.sol for more details. We suggest a tuple of three elements: [successOrNotFlag, requestId, data] as
// the return value.
//
export default function main(request: HexString, settings: string): HexString {
  console.log(`handle req: ${request}`);
  let requestId, encodedProfileId;
  try {
    [requestId, encodedProfileId] = Coders.decode([uintCoder, bytesCoder], request);
  } catch (error) {
    console.info("Malformed request received");
    return encodeReply([TYPE_ERROR, 0, error as string]);
  }
  const profileId = parseProfileId(encodedProfileId as string);
  console.log(`Request received for profile ${profileId}`);

  try {
    const respData = fetchQuote();
    let stats = `"${respData.content}" - ${respData.author}`;
    console.log("response:", [TYPE_RESPONSE, requestId, stats]);
    return encodeReply([TYPE_RESPONSE, requestId, stats]);
  } catch (error) {
    if (error === Error.FailedToFetchData) {
      throw error;
    } else {
      // otherwise tell client we cannot process it
      console.log("error:", [TYPE_ERROR, requestId, error]);
      return encodeReply([TYPE_ERROR, requestId, error as string]);
    }
  }
}
