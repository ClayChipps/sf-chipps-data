/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'node:fs';
import path from 'node:path';
import FormData from 'form-data';
import got from 'got';
import { Connection } from '@salesforce/core';
import { ContentVersionCreateRequest, ContentVersion, ContentVersionCreateResult } from './contentVersionTypes.js';

export async function uploadContentVersion(
  targetOrgConnection: Connection,
  pathOnClient: string,
  title?: string,
  firstPublishLocationId?: string
): Promise<ContentVersion> {
  // Check that we have access to the file
  await fs.promises.access(pathOnClient, fs.constants.F_OK);

  const contentVersionCreateRequest: ContentVersionCreateRequest = {
    FirstPublishLocationId: firstPublishLocationId,
    PathOnClient: pathOnClient,
    Title: title ?? path.basename(pathOnClient),
  };

  const form = new FormData();
  form.append('entity_content', JSON.stringify(contentVersionCreateRequest), { contentType: 'application/json' });
  form.append('VersionData', fs.createReadStream(pathOnClient), { filename: path.basename(pathOnClient) });

  const data: ContentVersionCreateResult = await got.post(`${targetOrgConnection.baseUrl()}/sobjects/ContentVersion`, {
    body: form,
    headers: {
      Authorization: `Bearer ${targetOrgConnection.accessToken}`,
      'Content-Type': `multipart/form-data; boundary="${form.getBoundary()}"`,
    },
    resolveBodyOnly: true,
    responseType: 'json',
  });

  const queryResult = await targetOrgConnection.singleRecordQuery(
    `SELECT ContentDocumentId, FileExtension, Id, Title FROM ContentVersion WHERE Id='${data.id}'`
  );

  return queryResult as ContentVersion;
}
