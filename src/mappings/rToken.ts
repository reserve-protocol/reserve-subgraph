// // * RToken Deployment
// export function handleCreateToken(event: RTokenCreated): void {
//   // Create related tokens
//   let rToken = getTokenInitial(event.params.rToken, TokenType.RToken);
//   let stToken = getTokenInitial(event.params.stRSR, TokenType.StakingToken);

//   getSupplyInitial(rToken.id);
//   getSupplyInitial(stToken.id);

//   let mainContract = MainContract.bind(event.params.main);
//   let basketHandlerAddress = mainContract.basketHandler();
//   let basketHandler = getBasketHandler(basketHandlerAddress.toHexString());

//   // Create Main entity
//   let main = new Main(event.params.main.toHexString());
//   main.address = event.params.main;
//   main.owner = event.params.owner;
//   main.facade = event.params.facade;
//   main.token = rToken.id;
//   main.stToken = stToken.id;
//   main.basketHandler = basketHandlerAddress;

//   main.staked = BI_ZERO;
//   main.save();

//   // Main relationships
//   basketHandler.main = main.id;
//   rToken.main = main.id;
//   stToken.main = main.id;
//   rToken.save();
//   stToken.save();
//   basketHandler.save();

//   // Initialize dynamic mappings for the new RToken system
//   RTokenTemplate.create(event.params.rToken);
//   stRSRTemplate.create(event.params.stRSR);
//   BasketHandlerTemplate.create(basketHandlerAddress);
// }
