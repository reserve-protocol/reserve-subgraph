import {
  Issuance as RSVIssuance,
  Redemption as RSVRedemption,
} from "../../generated/RSVManager/RSVManager";
import {
  getOrCreateAccount,
  getOrCreateEntry,
  getOrCreateToken,
} from "../common/getters";
import { EntryType, RSV_ADDRESS } from "./../common/constants";

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
}
