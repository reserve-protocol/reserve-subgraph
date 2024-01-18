import { ByteArray, Bytes, crypto, ethereum } from "@graphprotocol/graph-ts";

// Input: Receive an array of encoded values.
// Output: Return the hash of the encoded values.
export function encodeAndHash(values: ethereum.Value[]): ByteArray {
  return crypto.keccak256(
    adjustEncoding(
      ethereum.encode(
        ethereum.Value.fromArray(values)
      )!
    )
  )
}

// Remove the first bytes from the encoded data.
export function adjustEncoding(encodedBytes: Bytes): Bytes {
  return Bytes.fromUint8Array(encodedBytes.slice(64))
}


