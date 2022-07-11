import { RSV_ADDRESS } from "./../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/templates/RToken/RToken";
import {
  Issuance as RSVIssuance,
  Redemption as RSVRedemption,
} from "../../generated/RSVManager/RSVManager";
import { Entry } from "../../generated/schema";
import {
  EntryStatus,
  EntryType,
  getConcatenatedId,
  RSVInfo,
} from "../utils/helper";
import { handleRTokenRedemption, handleTransfer } from "../mapping";
import { getMain, getTransaction, getUser } from "../utils/getters";
import { getOrCreateAccount, getOrCreateToken } from "../common/getters";

const RSV_ADDRESS = "0x196f4727526eA7FB1e17b2071B3d8eAA38486988";

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

// Handles RSV redemption
export function handleRTokenRedemption(event: RSVRedemption): void {
  let account = getOrCreateAccount(event.params.user);
  let token = getOrCreateToken(Address.fromString(RSV_ADDRESS));

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(
    getConcatenatedId("Redeem", event.transaction.hash.toHexString())
  );
  entry.createdAt = event.block.timestamp;
  entry.token = tokenAddress;
  entry.main = mainAddress;
  entry.user = user.id;
  entry.transaction = trx.id;
  entry.amount = amount;
  entry.type = EntryType.Redemption;
  entry.status = EntryStatus.Completed;
  entry.save();
}

// Handle token redemption
export function handleRedemption(event: RSVRedemption): void {
  handleRTokenRedemption(
    event,
    Address.fromString(RSVInfo.main),
    event.params.user,
    event.params.amount,
    true
  );
}

// Handles transfer, override token hash to match the current token hash
export function handleTransferOldRSV(event: TransferEvent): void {
  event.address = Address.fromString(RSVInfo.address);
  handleTransfer(event);
}
