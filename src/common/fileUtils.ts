/*
 * Copyright (c) 2023, Clay Chipps
 * All rights reserved.
 * Licensed under the MIT License.
 * For full license text, see LICENSE.md file in the repo root or https://opensource.org/licenses/MIT
 */

import { createReadStream } from 'node:fs';
import { Connection } from '@salesforce/core';
import { CreateResult, ContentVersionCreateRequest, ContentVersion } from './typeDefs.js';

export async function uploadContentVersion(
  connection: Connection,
  pathOnClient: string,
  title?: string,
  firstPublishLocationId?: string
): Promise<ContentVersion> {
  const contentVersionCreateRequest: ContentVersionCreateRequest = {
    FirstPublishLocationId: firstPublishLocationId,
    PathOnClient: pathOnClient,
    Title: title,
  };

  // Build the multi-part form data to be passed to the Request
  /* eslint-disable camelcase */
  const formData = {
    entity_content: {
      value: JSON.stringify(contentVersionCreateRequest),
      options: {
        contentType: 'application/json',
      },
    },
    VersionData: createReadStream(pathOnClient),
  };
  /* eslint-enable camelcase */

  // POST the multipart form to Salesforce's API, can't use the normal "create" action because it doesn't support multipart
  // Had to bypass the type def to allow formData to pass through, will try and get it patched into the type def later
  // it is handled correctly by the underlying 'request' library.
  // https://github.com/request/request#multipartform-data-multipart-form-uploads
  /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
  const contentVersion = (await connection.request({
    url: `/services/data/v${connection.getApiVersion()}/sobjects/ContentVersion`,
    formData,
    method: 'POST',
  } as any)) as CreateResult;
  /* eslint-enable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

  const queryResult = await connection.singleRecordQuery(
    `SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id='${contentVersion.id}'`
  );

  return queryResult as ContentVersion;
}
