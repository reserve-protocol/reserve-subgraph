import { Transfer as TransferEvent } from "../../generated/templates/RToken/RToken";
import {
  getOrCreateAccount,
  getOrCreateEntry,
  getOrCreateToken,
} from "../common/getters";
import { updateAccountBalance, updateTokenMetrics } from "../common/metrics";
import { BIGINT_ZERO, EntryType, ZERO_ADDRESS } from "./../common/constants";

/**
 * Tracks ERC20 token transfer
 *
 * RSV and RToken output ERC20
 */
export function handleTransfer(event: TransferEvent): void {
  let fromAccount = getOrCreateAccount(event.params.from);
  let toAccount = getOrCreateAccount(event.params.to);
  let token = getOrCreateToken(event.address);
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
