import {
  Issuance as RSVIssuance,
  Redemption as RSVRedemption,
} from "../../generated/RSVManager/RSVManager";
import {
  getOrCreateEntry,
  getOrCreateToken,
  getTokenAccount,
} from "../common/getters";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { EntryType, RSV_ADDRESS } from "./../common/constants";

// Handles token issuance
export function handleIssuance(event: RSVIssuance): void {
  let account = getTokenAccount(event.params.user, RSV_ADDRESS);
  let token = getOrCreateToken(RSV_ADDRESS);

  // Create entry
  let entry = getOrCreateEntry(
    event,
    token.id,
    account.id,
    event.params.amount,
    EntryType.ISSUE
  );
  entry.amountUSD = bigIntToBigDecimal(event.params.amount).times(
    token.lastPriceUSD
  );
  entry.rToken = event.address.toHexString();
  entry.save();
}

// Handles RSV redemption
export function handleRedemption(event: RSVRedemption): void {
  let account = getTokenAccount(event.params.user, RSV_ADDRESS);
  let token = getOrCreateToken(RSV_ADDRESS);

  // Create entry
  let entry = getOrCreateEntry(
    event,
    token.id,
    account.id,
    event.params.amount,
    EntryType.REDEEM
  );

  entry.amountUSD = bigIntToBigDecimal(event.params.amount).times(
    token.lastPriceUSD
  );
  entry.rToken = event.address.toHexString();
  entry.save();
}
