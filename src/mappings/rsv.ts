import { RSV_ADDRESS, ZERO_ADDRESS } from "./../common/constants";
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
import {
  getOrCreateAccount,
  getOrCreateEntry,
  getOrCreateToken,
} from "../common/getters";

const RSV_ADDRESS = "0x196f4727526eA7FB1e17b2071B3d8eAA38486988";

/**
 * * RSV specific mappings
 */

// Handles token issuance
export function handleIssuance(event: RSVIssuance): void {
  let account = getOrCreateAccount(event.params.user);
  let token = getOrCreateToken(Address.fromString(RSV_ADDRESS));

  // Create entry
  let entry = getOrCreateEntry(
    event,
    token.id,
    account.id,
    EntryType.Redemption
  );
  entry.amount = event.params.amount;
  entry.save();
}

// Handles RSV redemption
export function handleRedemption(event: RSVRedemption): void {
  let account = getOrCreateAccount(event.params.user);
  let token = getOrCreateToken(Address.fromString(RSV_ADDRESS));

  // Create entry
  let entry = getOrCreateEntry(
    event,
    token.id,
    account.id,
    EntryType.Redemption
  );
  entry.amount = event.params.amount;
  entry.save();
  // TODO: Update analytics
}

export function handleTransfer(event: TransferEvent): void {
  let fromAccount = getOrCreateAccount(event.params.from);
  let toAccount = getOrCreateAccount(event.params.to);
  let token = getOrCreateToken(Address.fromString(RSV_ADDRESS));

  let entryType = EntryType.Transfer;

  if (ZERO_ADDRESS == event.params.to.toHexString()) {
    entryType = EntryType.Burn;
  } else if (ZERO_ADDRESS == event.params.from.toHexString()) {
    entryType = EntryType.Mint;
  }

  let entry = getOrCreateEntry(event, token.id, fromAccount.id, entryType);
  // TODO: Update analytics
}

// Handles transfer, override token hash to match the current token hash
export function handleTransferOldRSV(event: TransferEvent): void {
  event.address = Address.fromString(RSVInfo.address);
  handleTransfer(event);
}
