import { Account, RTokenContract } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/templates/RToken/RToken";
import {
  getOrCreateEntry,
  getOrCreateToken,
  getTokenAccount,
} from "../common/getters";
import { updateAccountBalance, updateTokenMetrics } from "../common/metrics";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { BIGINT_ZERO, EntryType, ZERO_ADDRESS } from "./../common/constants";

/**
 * Tracks ERC20 token transfer
 *
 * RSV and RToken output ERC20
 */
export function handleTransfer(event: TransferEvent): void {
  let token = getOrCreateToken(event.address);
  let rTokenId = token.rToken;
  let fromAccount = getTokenAccount(event.params.from, event.address);
  let toAccount = getTokenAccount(event.params.to, event.address);
  let entryType = EntryType.TRANSFER;

  if (!fromAccount) {
    fromAccount = new Account(event.params.from.toHexString());
    fromAccount.save();
  }

  let isMelting = RTokenContract.load(event.params.to.toHexString());

  if (isMelting) {
    entryType = EntryType.BURN;
  } else if (ZERO_ADDRESS == event.params.to.toHexString()) {
    entryType = EntryType.REDEEM;
  } else if (ZERO_ADDRESS == event.params.from.toHexString()) {
    entryType = EntryType.MINT;
  }

  // dont update zero address
  if (entryType != EntryType.MINT) {
    updateAccountBalance(
      event.params.from,
      event.address,
      BIGINT_ZERO.minus(event.params.value),
      event
    );
  }

  if (entryType != EntryType.BURN && entryType != EntryType.REDEEM) {
    updateAccountBalance(
      event.params.to,
      event.address,
      event.params.value,
      event
    );
  }

  let userAddress = event.params.from;

  if (entryType == EntryType.MINT) {
    userAddress = event.params.to;
  }

  // Update token analytics
  updateTokenMetrics(
    event,
    event.address,
    userAddress,
    event.params.value,
    entryType
  );

  let entry = getOrCreateEntry(
    event,
    token.id,
    fromAccount.id,
    event.params.value,
    entryType
  );
  // Transfer specific
  entry.to = toAccount.id;
  entry.amountUSD = token.lastPriceUSD.times(
    bigIntToBigDecimal(event.params.value)
  );
  if (rTokenId) {
    entry.rToken = rTokenId;
  }
  entry.save();
}
