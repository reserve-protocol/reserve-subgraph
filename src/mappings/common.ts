import { Address } from "@graphprotocol/graph-ts";
import { Account } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/templates/RToken/RToken";
import { getOrCreateEntry, getOrCreateToken } from "../common/getters";
import {
  updateAccountBalance,
  updateRTokenUniqueUsers,
  updateTokenMetrics,
} from "../common/metrics";
import {
  BIGINT_ZERO,
  EntryType,
  INT_ONE,
  ZERO_ADDRESS,
} from "./../common/constants";

function getTokenAccount(
  accountAddress: Address,
  tokenAddress: Address
): Account {
  let account = Account.load(accountAddress.toHexString());

  if (!account) {
    account = new Account(accountAddress.toHexString());

    // Update token analytics
    let token = getOrCreateToken(tokenAddress);
    token.userCount += INT_ONE;
    token.save();

    if (token.rToken) {
      updateRTokenUniqueUsers(token.rToken);
    }
  }

  return account;
}

/**
 * Tracks ERC20 token transfer
 *
 * RSV and RToken output ERC20
 */
export function handleTransfer(event: TransferEvent): void {
  let token = getOrCreateToken(event.address);
  let fromAccount = getTokenAccount(event.params.from, event.address);
  let toAccount = getTokenAccount(event.params.to, event.address);
  let entryType = EntryType.TRANSFER;

  if (!fromAccount) {
    fromAccount = new Account(event.params.from.toHexString());
  }

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

  // dont update zero address
  if (entryType !== EntryType.MINT) {
    updateAccountBalance(
      event.params.from,
      event.address,
      BIGINT_ZERO.minus(event.params.value),
      event
    );
  }

  if (entryType !== EntryType.BURN) {
    updateAccountBalance(
      event.params.to,
      event.address,
      BIGINT_ZERO.minus(event.params.value),
      event
    );
  }

  // Update token analytics
  updateTokenMetrics(
    event,
    event.address,
    event.params.from,
    event.params.value,
    entryType
  );
}
