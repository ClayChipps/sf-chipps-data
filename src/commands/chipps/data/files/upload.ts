/*
 * Copyright (c) 2023, Clay Chipps
 * All rights reserved.
 * Licensed under the MIT License.
 * For full license text, see LICENSE.md file in the repo root or https://opensource.org/licenses/MIT
 */

import fs from 'node:fs';
import { parse } from 'csv-parse';
import { createObjectCsvWriter } from 'csv-writer';
import PQueue from 'p-queue';
import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { uploadContentVersion } from '../../../../common/fileUtils.js';
import { FileToUpload } from '../../../../common/typeDefs.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-chipps-data', 'chipps.data.files.upload');

export default class DataFilesUpload extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'api-version': Flags.orgApiVersion(),
    'file-path': Flags.directory({
      summary: messages.getMessage('flags.file-path.summary'),
      description: messages.getMessage('flags.file-path.description'),
      required: true,
    }),
    'max-parallel-jobs': Flags.integer({
      summary: messages.getMessage('flags.max-parallel-jobs.summary'),
      description: messages.getMessage('flags.max-parallel-jobs.description'),
      default: 1,
    }),
    'target-org': Flags.requiredOrg(),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DataFilesUpload);

    // Authorize to the target org
    const targetOrgConnection = flags['target-org']?.getConnection(flags['api-version']);

    if (!targetOrgConnection) {
      throw messages.createError('error.targetOrgConnectionFailed');
    }

    this.spinner.start('Initializing file upload', '\n', { stdout: true });

    const successWriter = createObjectCsvWriter({
      path: 'success.csv',
      header: [
        { id: 'PathOnClient', title: 'PathOnClient' },
        { id: 'Title', title: 'Title' },
        { id: 'FirstPublishLocationId', title: 'FirstPublishLocationId' },
        { id: 'ContentDocumentId', title: 'ContentDocumentId' },
      ],
    });

    const errorWriter = createObjectCsvWriter({
      path: 'error.csv',
      header: [
        { id: 'PathOnClient', title: 'PathOnClient' },
        { id: 'Title', title: 'Title' },
        { id: 'FirstPublishLocationId', title: 'FirstPublishLocationId' },
        { id: 'Error', title: 'Error' },
      ],
    });

    this.spinner.stop();

    const fileQueue = new PQueue({ concurrency: flags['max-parallel-jobs'] });

    const parser = fs.createReadStream(flags['file-path']).pipe(parse({ bom: true, columns: true }));

    this.spinner.start('Uploading files', 'Initializing\n', { stdout: true });

    let count = 0;
    fileQueue.on('add', () => {
      this.spinner.status = `Completed: ${count}. Size: ${fileQueue.size}  Pending: ${fileQueue.pending}\n`;
    });

    fileQueue.on('completed', () => {
      count++;
      this.spinner.status = `Completed: ${count}. Size: ${fileQueue.size}  Pending: ${fileQueue.pending}\n`;
    });

    for await (const record of parser) {
      void fileQueue.add(async () => {
        const fileToUpload = record as FileToUpload;
        try {
          const contentVersion = await uploadContentVersion(
            targetOrgConnection,
            fileToUpload.PathOnClient,
            fileToUpload.Title,
            fileToUpload.FirstPublishLocationId
          );
          fileToUpload.ContentDocumentId = contentVersion.ContentDocumentId;
          await successWriter.writeRecords([fileToUpload]);
        } catch (error) {
          fileToUpload.Error = error as string;
          await errorWriter.writeRecords([fileToUpload]);
        }
      });
    }

    await fileQueue.onIdle();

    this.spinner.stop();
  }
}
