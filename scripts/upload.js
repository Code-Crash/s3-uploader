'use strict';

/**
 * @author code-crash
 * @description This file is responsible to upload the large set of files on your S3 buckets
 */

require('dotenv-expand')(require('dotenv').config(__dirname + '/../.env')); // Setup Environment Variables
const AWS = require("aws-sdk"); // imports AWS SDK
const mime = require('mime-types') // mime type resolver
const fs = require("fs"); // utility from node.js to interact with the file system
const path = require("path"); // utility from node.js to manage file/folder paths
const logger = require('../logger');
const chalk = require('chalk');
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
process.stdin.setEncoding('utf-8');

// Declare useful variables.
let pathSet = false; // default false
let confirm = '';
let isReady = false; // default false
let isSameStructure = false; // default false

/**
 * @description - This function will handle the command line input on prompt with validation
 */
function lineIterator() {
    return new Promise(function (resolve, reject) {
        rl.setPrompt(`Are you sure, your folder to be uploaded is ${process.env.UPLOAD_TO_S3_PATH} path? [y|n] `);
        rl.prompt();
        rl.on('line', function (line) {
            if (line && !pathSet) {
                if (line === 'Y' || line === 'y') {
                    pathSet = true;
                }
            } else if (pathSet && line) {
                confirm = line;
            }

            // Validate Input
            if (!pathSet) {
                console.log('\nPlease Confirm Folder Path to upload on S3 Bucket.\n');
                rl.setPrompt(`Are you sure, your folder to be uploaded is ${process.env.UPLOAD_TO_S3_PATH} path? [y|n] `);
                rl.prompt();
            } else if (pathSet && !confirm) {
                console.log(chalk.red('\nTo Abort Upload, Press Control+C or Exit From Terminal before Confirming Next Step.\n'));
                console.log('\nPlease Confirm.\n');
                rl.setPrompt(`Are you sure, you want to upload on ${process.env.S3_BUCKET_NAME}/${process.env.S3_BUCKET_PATH} path? if No, it will upload the same folder structure to your S3 bucket. [y|n] `);
                rl.prompt();
            } else if (pathSet && confirm) {
                if (confirm === 'Y' || confirm === 'y') {
                    isSameStructure = false;
                    isReady = true;
                } else {
                    isSameStructure = true;
                    isReady = true;
                }
                rl.close();
            }
        });
        rl.on('close', function () {
            resolve({
                next: function () {
                    // console.log(folderPath);
                }
            });
        })
    })
}

// Handle command line stuff then call deploy method.
lineIterator().then(function () {
    if (isReady) {
        initiate();
    } else {
        console.log('\nOkay, We are stopping upload.\n');
    }
})


/**
 * @description - This function will help you to do the deployment your files on s3 bucket.
 */
function initiate() {

    if (!process.env.UPLOAD_TO_S3_PATH) {
        console.log('Folder Path to be uploaded is is missing!');
        return;
    }

    if (process.env && (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_ACCESS_SECRET)) {
        console.log('S3 Bucket keys not found in .env, please have a look');
        return;
    }
    console.log('Please hold a minute, this process can take a time based on numbers of files.');
    // configuration necessary for this script to run
    const config = {
        s3BucketName: process.env.S3_BUCKET_NAME,
        folderPath: process.env.UPLOAD_TO_S3_PATH || '' // path relative script's location
    };

    AWS.config.update({
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_ACCESS_SECRET
    });

    // initialize S3 client
    const s3 = new AWS.S3({
        signatureVersion: 'v4'
    });

    // resolve full folder path
    const distFolderPath = config.folderPath;// path.join(__dirname, config.folderPath);

    // Normalize \\ paths to / paths.
    function unixify(filePath) {
        return process.platform === 'win32' ? filePath.replace(/\\/g, '/') : filePath;
    }

    // Recursive into a directory, executing callback for each file.
    function traverse(rootDir, callback, subDir) {
        // is sub-directory
        const isSubDir = subDir ? true : false;
        // absolute path
        const absPath = subDir ? path.join(rootDir, subDir) : rootDir;

        // read all files in the current directory
        const files = fs.readdirSync(absPath);
        logger.info('File Length is:' + files.length);
        files.forEach((filename) => {
            // full file path
            const filePath = path.join(absPath, filename);
            // check if current path is a directory
            if (fs.statSync(filePath).isDirectory()) {
                traverse(rootDir, callback, unixify(path.join(subDir || '', filename || '')))
            } else {
                fs.readFile(filePath, (error, fileContent) => {
                    // if unable to read file contents, throw exception
                    if (error) {
                        throw error;
                    }

                    // map the current file with the respective MIME type
                    const mimeType = mime.lookup(filePath)
                    let s3Obj = {
                        Key: filename,
                        Body: fileContent,
                        ContentType: mimeType,
                        ACL: 'public-read'
                    };
                    if (isSameStructure) {
                        s3Obj['Bucket'] = isSubDir ? `${config.s3BucketName}/${subDir}` : config.s3BucketName;
                    } else {
                        s3Obj['Bucket'] = `${config.s3BucketName}/${process.env.S3_BUCKET_PATH}`;
                    }

                    // build S3 PUT object requests
                    // logger.info(`Trying to upload ${s3Obj.Key} on ${s3Obj.Bucket}`);
                    // upload file to S3
                    s3.putObject(s3Obj, (err, res) => {
                        if (err) {
                            logger.error(err);
                        } else {
                            logger.info(`Successfully uploaded '${filePath}' with MIME type '${mimeType}' and response is ${JSON.stringify(res)}`);
                        }
                    });
                });
            }
        })
    }
    // start upload process
    traverse(distFolderPath, (filePath, rootDir, subDir, filename) => {
        logger.info(`FilePath ${filePath} ${rootDir} ${subDir} ${filename}`);
    });
}