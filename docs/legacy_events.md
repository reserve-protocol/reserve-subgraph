# List of legacy supported events (2.0.0/2.0.1)

This list of events share the same event handler and need to be copied from the old ABIs, a copy is left here for convenience.

### StRSR

```
[
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "era",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "staker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rsrAmount",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "stRSRAmount",
        "type": "uint256"
      }
    ],
    "name": "Staked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint192",
        "name": "oldVal",
        "type": "uint192"
      },
      {
        "indexed": true,
        "internalType": "uint192",
        "name": "newVal",
        "type": "uint192"
      }
    ],
    "name": "ExchangeRateSet",
    "type": "event"
  }
]
```
