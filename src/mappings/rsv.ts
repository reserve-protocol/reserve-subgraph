import {
  Issuance as RSVIssuance,
  Redemption as RSVRedemption,
} from "../../generated/RSVManager/RSVManager";
import {
  getOrCreateEntry,
  getOrCreateToken,
  getTokenAccount,
} from "../common/getters";
import { EntryType, RSV_ADDRESS } from "./../common/constants";

// Handles token issuance
export function handleIssuance(event: RSVIssuance): void {
  let account = getTokenAccount(event.params.user, RSV_ADDRESS);
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
  let account = getTokenAccount(event.params.user, RSV_ADDRESS);
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
