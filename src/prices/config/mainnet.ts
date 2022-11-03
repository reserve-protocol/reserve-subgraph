import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "mainnet";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString(
  "0x8263e161A855B644f582d9C164C66aABEe53f927"
);
export const SUSHISWAP_WETH_ADDRESS = Address.fromString(
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F")
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS = new TypedMap<string, Address>();
WHITELIST_TOKENS.set(
  "WETH",
  Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0xdac17f958d2ee523a2206206994597c13d831ec7")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599")
);
WHITELIST_TOKENS.set(
  "EURS",
  Address.fromString("0xdB25f211AB05b1c97D595516F45794528a807ad8")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0x514910771AF9Ca656af840dff83E8264EcF986CA")
);
