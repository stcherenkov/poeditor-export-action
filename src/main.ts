import * as core from '@actions/core'
import * as fs from 'fs/promises'
import path from 'path'
const pkg = require('../package.json')

enum RsStatus {
  Completed = 'success',
  Failed = 'fail'
}

type RsMeta = {
  status: RsStatus
  code: string
  message: string
}

type Result = {
  url: string
}

type Response = {
  response: RsMeta
  result?: Result
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token: string = core.getInput('api_token', { required: true })
    const projectId: string = core.getInput('project_id', { required: true })
    const language: string = core.getInput('language', { required: true })
    const outputType: string = core.getInput('output_type', { required: true })

    const userAgent = `github/poeditor-export-action/v${pkg.version}`
    const form = new FormData()

    form.set('api_token', token)
    form.set('id', projectId)
    form.set('language', language)
    form.set('type', outputType)

    core.info(
      `Downloading translation file for ${projectId}/${language} in format ${outputType} ...`
    )

    const createExportRs = await fetch(
      'https://api.poeditor.com/v2/projects/export',
      {
        method: 'POST',
        body: form,
        headers: new Headers({
          'User-Agent': userAgent
        })
      }
    )

    core.debug('Got export response, parsing JSON...')

    const exportBody = (await createExportRs.json()) as Response

    core.debug(`Export response: ${JSON.stringify(exportBody)}`)

    if (exportBody.response.status === RsStatus.Failed || !exportBody.result) {
      core.setFailed(
        `Export request errored with status code ${exportBody.response.code}: ${exportBody.response.message}`
      )
      return
    }

    core.debug(`Fetching translation at ${exportBody.result.url}...`)

    const exportFileRs = await fetch(exportBody.result.url, {
      headers: new Headers({
        'User-Agent': userAgent
      })
    })

    core.debug('Got file response, processing...')

    const exportFileContents = await exportFileRs.text()

    core.info('Downloaded')
    core.debug(`File length: ${exportFileContents.length} characters`)

    if (!process.env['RUNNER_TEMP']) {
      core.setFailed('Cannot access temporary directory')
      return
    }

    const outputPath = path.resolve(
      process.env['RUNNER_TEMP'],
      `${projectId}-${language}-${outputType}`
    )

    core.debug(`Writing output to temporary file ${outputPath}`)

    await fs.writeFile(outputPath, exportFileContents, 'utf8')

    core.setOutput('file_path', outputPath)
    core.info('Export saved')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
