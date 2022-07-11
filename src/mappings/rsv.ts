import { Address } from "@graphprotocol/graph-ts";
import {
  Issuance as RSVIssuance,
  Redemption as RSVRedemption,
} from "../../generated/RSVManager/RSVManager";
import { Transfer as TransferEvent } from "../../generated/templates/RToken/RToken";
import {
  getOrCreateAccount,
  getOrCreateEntry,
  getOrCreateToken,
} from "../common/getters";
import { EntryType, ZERO_ADDRESS } from "./../common/constants";

const RSV_ADDRESS = Address.fromString(
  "0x196f4727526eA7FB1e17b2071B3d8eAA38486988"
);

/**
 * * RSV specific mappings
 */

// Handles token issuance
export function handleIssuance(event: RSVIssuance): void {
  let account = getOrCreateAccount(event.params.user);
  let token = getOrCreateToken(RSV_ADDRESS);

  // Create entry
  getOrCreateEntry(
    event,
    token.id,
    account.id,
    event.params.amount,
    EntryType.ISSUE
  );

  // TODO: Update analytics
}

// Handles RSV redemption
export function handleRedemption(event: RSVRedemption): void {
  let account = getOrCreateAccount(event.params.user);
  let token = getOrCreateToken(RSV_ADDRESS);

  // Create entry
  getOrCreateEntry(
    event,
    token.id,
    account.id,
    event.params.amount,
    EntryType.REDEEM
  );

  // TODO: Update analytics
}

export function handleTransfer(event: TransferEvent): void {
  let fromAccount = getOrCreateAccount(event.params.from);
  let toAccount = getOrCreateAccount(event.params.to);
  let token = getOrCreateToken(RSV_ADDRESS);

  let entryType = EntryType.TRANSFER;

  if (ZERO_ADDRESS == event.params.to.toHexString()) {
    entryType = EntryType.BURN;
  } else if (ZERO_ADDRESS == event.params.from.toHexString()) {
    entryType = EntryType.MINT;
  }

  let entry = getOrCreateEntry(
    event,
    token.id,
    fromAccount.id,
    event.params.value,
    entryType
  );

  // Transfer specific
  entry.to = toAccount.id;
  entry.save();

  // TODO: Update analytics
}
