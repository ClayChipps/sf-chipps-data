/*
 * Copyright (c) 2023, Clay Chipps
 * All rights reserved.
 * Licensed under the MIT License.
 * For full license text, see LICENSE.md file in the repo root or https://opensource.org/licenses/MIT
 */

import { createReadStream } from 'node:fs';
import FormData from 'form-data';
import got from 'got';
import { Connection } from '@salesforce/core';
import { ContentVersionCreateRequest, ContentVersion, CreateResult } from './typeDefs.js';

export async function uploadContentVersion(
  targetOrgConnection: Connection,
  pathOnClient: string,
  title?: string,
  firstPublishLocationId?: string
): Promise<ContentVersion> {
  const contentVersionCreateRequest: ContentVersionCreateRequest = {
    FirstPublishLocationId: firstPublishLocationId,
    PathOnClient: pathOnClient,
    Title: title,
  };

  const form = new FormData();
  form.append('entity_content', JSON.stringify(contentVersionCreateRequest), { contentType: 'application/json' });
  form.append('VersionData', createReadStream(pathOnClient), { filename: pathOnClient });

  const data = await got
    .post(`${targetOrgConnection.baseUrl()}/sobjects/ContentVersion`, {
      body: form,
      headers: {
        Authorization: `Bearer ${targetOrgConnection.accessToken}`,
        'Content-Type': `multipart/form-data; boundary="${form.getBoundary()}"`,
      },
    })
    .json<CreateResult>();

  const queryResult = await targetOrgConnection.singleRecordQuery(
    `SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id='${data.id}'`
  );

  return queryResult as ContentVersion;
}
