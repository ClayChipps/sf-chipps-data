# summary

Upload a file to a Salesforce org.

# description

Uploads a file to a Salesforce org.

# flags.file-path.summary

Path to the file to upload.

# flags.first-publish-location-id.summary

Specify a record Id that the file should be linked to.

# flags.title.summary

Specify the title for the file being uploaded.

# examples

- <%= config.bin %> <%= command.id %> --file-path fileToUpload.txt --target-org myTargetOrg

- <%= config.bin %> <%= command.id %> --file-path fileToUpload.txt --first-publish-location-id 0019000000DmehK --target-org myTargetOrg

# error.targetOrgConnectionFailed

Unable to establish connection to the org.
