/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export interface ContentVersion {
  attributes: object;
  ContentDocumentId?: string;
  FileExtension: string;
  Id: string;
  Name?: string;
  Title: string;
  VersionData: string;
}

export interface ContentVersionCreateRequest {
  FirstPublishLocationId?: string;
  PathOnClient: string;
  Title?: string;
}

export interface CreateResult {
  id: string;
  success: boolean;
  errors: string[];
  name: string;
  message: string;
}

export type FileToUpload = {
  ContentDocumentId?: string;
  Error?: string;
  FirstPublishLocationId?: string;
  PathOnClient: string;
  Title: string;
};
