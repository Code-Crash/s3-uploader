# S3 Uploader is a script to upload your large chunk of files on S3 bucket

## Features

1. Upload the bulk files on S3 Bucket.
2. Upload the exact file structure to the S3.
3. Upload files in your chosen folder on S3.

## Prerequisites

1. Node.js should be installed
2. NPM should be installed
3. You should have an AWS account with the Access key, Secret key and S3 bucket should be already created.
4. You have a basic idea about scripting in Node.js

## How to use it?

1. Clone the repository.
2. Open the Terminal and navigate to the cloned repository.
3. Copy the content of .env.example file into a new file which is .env and update correct details in .env.
4. Run ```npm install```
5. Run ```node scripts/upload.js```
6. Follow the instructions visible to Terminal.
7. See the Terminal for the logs, or check the logs/error.log or logs/info.log file for logs 

## TODO:

1. Provide the URL of each file in logs.
2. Add a feature to check if the uploaded URL is valid and it's working properly and generate the logs based on that.
3. Add support to export this script as a node js global module.