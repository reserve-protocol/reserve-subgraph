import { BigInt } from '@graphprotocol/graph-ts'
import { assert, clearStore, describe, test } from 'matchstick-as/assembly/index'
import { _createTimelockProposal } from '../src/mappings/governance'
import { createProposalCreatedEvent } from './events/ProposalCreated'



describe("Timelock test", () => {

  test('Generate timelock id', () => {
    const id = 13035241572565140239426347309198637847481528373469095017232500194936432553205
    const proposalCreatedEvent = createProposalCreatedEvent(BigInt.fromU64(id))

    const timelockId = _createTimelockProposal(proposalCreatedEvent)

    assert.stringEquals(timelockId, '0x784855018f91af5f996aa74ea0e9883adf646055a357a0e077af6eb2698f691e')
    clearStore()
  })
})
