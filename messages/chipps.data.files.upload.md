# summary

Upload files to a Salesforce org.

# description

Uploads files specified by a csv to a Salesforce org. By default, the plugin uses the REST API for the upload as the Bulk API is limited in its payload size. This means that each file will use one REST API request.

# flags.file-path.summary

Path to the csv file that specifies the upload.

# flags.file-path.description

The csv file must specify the columns PathOnClient and Title. Optionally, a FirstPublishLocationId can be specified to have it linked directly to a Salesforce record after upload.

# flags.max-parallel-jobs.summary

Maximum number of parallel jobs.

# flags.max-parallel-jobs.description

By default the plugin will only process a single file upload at a time. You can increase this value to allow for quasi concurrent uploads. Please note that setting this value too high can cause performance issues.

# examples

- <%= config.bin %> <%= command.id %> --file-path filesToUpload.csv --target-org myTargetOrg

- <%= config.bin %> <%= command.id %> --file-path filesToUpload.csv --max-parallel-jobs 5 --target-org myTargetOrg

# error.targetOrgConnectionFailed

Unable to establish connection to the org.
