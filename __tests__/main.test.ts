/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'

const runMock = jest.spyOn(main, 'run')

const getInputMock = jest
  .spyOn(core, 'getInput')
  .mockImplementation((name: string) => {
    switch (name) {
      case 'api_token':
        return 'token'
      case 'project_id':
        return '123456'
      case 'language':
        return 'eo'
      case 'output_type':
        return 'key_value_json'
      default:
        return ''
    }
  })

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses all inputs', async () => {
    await main.run()

    expect(runMock).toHaveBeenCalled()

    expect(getInputMock).toHaveBeenNthCalledWith(1, 'api_token', {
      required: true
    })
    expect(getInputMock).toHaveBeenNthCalledWith(2, 'project_id', {
      required: true
    })
    expect(getInputMock).toHaveBeenNthCalledWith(3, 'language', {
      required: true
    })
    expect(getInputMock).toHaveBeenNthCalledWith(4, 'output_type', {
      required: true
    })
  })
})
