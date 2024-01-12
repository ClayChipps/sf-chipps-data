/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { uploadContentVersion } from '../../../../common/fileUtils.js';
import { ContentVersion } from '../../../../common/typeDefs.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-chipps-data', 'chipps.data.file.upload');

export default class DataFileUpload extends SfCommand<ContentVersion> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'api-version': Flags.orgApiVersion(),
    'file-path': Flags.directory({
      summary: messages.getMessage('flags.file-path.summary'),
      required: true,
    }),
    'first-publish-location-id': Flags.string({
      summary: messages.getMessage('flags.first-publish-location-id.summary'),
    }),
    'target-org': Flags.requiredOrg(),
    title: Flags.string({
      summary: messages.getMessage('flags.title.summary'),
    }),
  };

  public async run(): Promise<ContentVersion> {
    const { flags } = await this.parse(DataFileUpload);

    // Authorize to the target org
    const targetOrgConnection = flags['target-org']?.getConnection(flags['api-version']);

    if (!targetOrgConnection) {
      throw messages.createError('error.targetOrgConnectionFailed');
    }

    this.spinner.start('Uploading file', '', { stdout: true });

    const contentVersion = await uploadContentVersion(
      targetOrgConnection,
      flags['file-path'],
      flags['title'],
      flags['first-publish-location-id']
    );

    this.spinner.stop();

    return contentVersion;
  }
}
