import { flags, SfdxCommand } from '@salesforce/command';
import { file2CV } from '../../../../common/file2CV';
import { Record } from '../../../../common/typeDefs';

export default class Upload extends SfdxCommand {
  public static description =
    'Upload multiple files based on a csv as standalone files or linked to records. The csv must have the following headers: Title, PathOnClient. The csv may have the following headers: FirstPublishLocationId. This utility uses the same setup as [Salesforce Dataloader for files](https://help.salesforce.com/articleView?id=000314772&type=1&mode=1).';

  public static examples = [`sfdx chipp:data:files:upload -p ~/FilesToUpload.csv`];

  protected static flagsConfig = {
    pathtocsv: flags.filepath({
      char: 'p',
      description: 'path to csv',
      required: true,
    }),
  };

  protected static requiresUsername = true;

  private async readFile(filePath: string): Promise<any> {
    const csv = require('csv-parser');
    const fs = require('fs');
    let rows = [];

    return new Promise<any>((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          rows.push(data);
        })
        .on('end', () => {
          resolve(rows);
        });
    });
  }

  public async run(): Promise<any> {
    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();

    const csvFilePath = this.flags.pathtocsv;

    this.ux.startSpinner('Reading CSV');

    let filesToUpload = await this.readFile(csvFilePath);

    this.ux.stopSpinner();

    this.ux.startSpinner('Loading files');

    const createCsvWriter = require('csv-writer').createObjectCsvWriter;

    const successWriter = createCsvWriter({
      path: 'success.csv',
      header: [
        { id: 'PathOnClient', title: 'PathOnClient' },
        { id: 'Title', title: 'Title' },
        { id: 'FirstPublishLocationId', title: 'FirstPublishLocationId' },
        { id: 'ContentDocumentId', title: 'ContentDocumentId' },
      ],
    });

    const errorWriter = createCsvWriter({
      path: 'error.csv',
      header: [
        { id: 'PathOnClient', title: 'PathOnClient' },
        { id: 'Title', title: 'Title' },
        { id: 'FirstPublishLocationId', title: 'FirstPublishLocationId' },
        { id: 'Error', title: 'Error' },
      ],
    });

    for (let [i, file] of filesToUpload.entries()) {
      let success = [];
      let failure = [];
      this.ux.startSpinner(`Loading file ${i + 1}`);
      try {
        const CV = (await file2CV(conn, file.PathOnClient, file.Title, file.FirstPublishLocationId)) as Record;

        file.ContentDocumentId = CV.ContentDocumentId;
        success.push(file);
        await successWriter.writeRecords(success);
      } catch (error) {
        file.Error = error;
        failure.push(file);
        await errorWriter.writeRecords(failure);
      } finally {
        this.ux.stopSpinner();
      }
    }

    return 'Success';
  }
}
