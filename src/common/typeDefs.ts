/*
 * Copyright (c) 2023, Clay Chipps
 * All rights reserved.
 * Licensed under the MIT License.
 * For full license text, see LICENSE.md file in the repo root or https://opensource.org/licenses/MIT
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
