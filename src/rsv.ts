import { Address } from "@graphprotocol/graph-ts";
import { Token } from "../generated/schema";
import { Transfer as TransferEvent } from "../generated/templates/RToken/RToken";
import {
  Issuance as RSVIssuance,
  Redemption as RSVRedemption,
} from "./../generated/RSVManager/RSVManager";
import { Entry } from "./../generated/schema";
import {
  EntryStatus,
  EntryType,
  getConcatenatedId,
  RSVInfo,
} from "./utils/helper";
import { handleRTokenRedemption, handleTransfer } from "./mapping";
import { getMain, getTransaction, getUser } from "./utils/getters";

/**
 * * RSV specific mappings
 */

// Handles token issuance
export function handleIssuance(event: RSVIssuance): void {
  let main = getMain(Address.fromString(RSVInfo.main));
  let user = getUser(event.params.user);
  let token = Token.load(main.token)!;

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(
    getConcatenatedId("Issuance", event.transaction.hash.toHexString())
  );
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
  entry.user = user.id;
  entry.transaction = trx.id;
  entry.amount = event.params.amount;
  entry.type = EntryType.Issuance;
  entry.status = EntryStatus.Completed;
  entry.save();
}

// Handle token redemption
export function handleRedemption(event: RSVRedemption): void {
  handleRTokenRedemption(
    event,
    Address.fromString(RSVInfo.main),
    event.params.user,
    event.params.amount
  );
}

// Handles transfer, override token hash to match the current token hash
export function handleTransferOldRSV(event: TransferEvent): void {
  event.address = Address.fromString(RSVInfo.address);
  handleTransfer(event);
}
