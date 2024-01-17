import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { newMockEvent } from 'matchstick-as/assembly/index'
import { ProposalCreated } from '../../generated/templates/Governance/Governor'

export function createProposalCreatedEvent(id: BigInt): ProposalCreated {
  const mockEvent = newMockEvent()
  const proposalCreatedEvent = new ProposalCreated(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt,
  )

  proposalCreatedEvent.parameters = new Array()
  const proposalId = new ethereum.EventParam('proposalId', ethereum.Value.fromUnsignedBigInt(id))
  const proposer = new ethereum.EventParam(
    'proposer',
    ethereum.Value.fromAddress(Address.fromString('0x0cF663Fd713e831AE75CEA5142a7415DfEfCEb42')),
  )
  const targets = new ethereum.EventParam(
    'targets',
    ethereum.Value.fromAddressArray([Address.fromString('0x7a7dd273ede5216c6c2f00531abe384918a754b6')]),
  )
  const values = new ethereum.EventParam('values', ethereum.Value.fromUnsignedBigIntArray([BigInt.fromI32(0)]))
  const signatures = new ethereum.EventParam('signatures', ethereum.Value.fromStringArray(['']))
  const calldatas = new ethereum.EventParam(
    'calldatas',
    ethereum.Value.fromBytesArray([Bytes.fromHexString('0x2F2FF15D50415553455200000000000000000000000000000000000000000000000000000000000000000000000000000CF663FD713E831AE75CEA5142A7415DFEFCEB42')]),
  )
  const startBlock = new ethereum.EventParam('startBlock', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9280425)))
  const endBlock = new ethereum.EventParam('endBlock', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9280445)))
  const description = new ethereum.EventParam('description', ethereum.Value.fromString('# test cancel test'))

  proposalCreatedEvent.parameters.push(proposalId)
  proposalCreatedEvent.parameters.push(proposer)
  proposalCreatedEvent.parameters.push(targets)
  proposalCreatedEvent.parameters.push(values)
  proposalCreatedEvent.parameters.push(signatures)
  proposalCreatedEvent.parameters.push(calldatas)
  proposalCreatedEvent.parameters.push(startBlock)
  proposalCreatedEvent.parameters.push(endBlock)
  proposalCreatedEvent.parameters.push(description)

  return proposalCreatedEvent
}
