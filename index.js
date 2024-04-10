const express = require("express");
const app = express();

const cors = require('cors');
app.use(cors());

require("dotenv").config();

const PORT = process.env.API_PORT;

app.use(express.json());
app.set("json spaces", 4);
app.use(express.static(__dirname + "/public")); 

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket("course-collab-bucket");


// Import and setup middleware
const logger = require("./middleware/logger");
app.use("/api", [logger]);

const fileUpload = require('express-fileupload');
app.use(fileUpload());


// Import and setup routes
app.get("/api/health", (req, res) => {
    res.status(200).json({health: "Course Collab files service OK"});
});

app.post('/api/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let uploadedFile = req.files.file;
    const options = {
        metadata: {
            contentType: 'auto',
            metadata: { 
                uploadedBy: req.body.uploadedBy 
            }
        }
    };
    const blob = bucket.file(req.body.course + "/" + req.body.semester + "/" + uploadedFile.name); 
    const blobStream = blob.createWriteStream(options);
    blobStream.on('error', err => {
        console.error(err);
        res.status(500).send('Error uploading to Google Cloud Storage!');
    });
    blobStream.on('finish', () => {
        // The public URL can be used to directly access the file
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        res.status(200).json({message: 'File uploaded successfully', url: publicUrl});
    });
    blobStream.end(uploadedFile.data);
});

async function listFilesInFolder(folderName) {
    const [files] = await bucket.getFiles({ prefix: folderName });
    const filesInfo = await Promise.all(files.map(async file => {
        const [metadata] = await file.getMetadata(); // Fetch detailed metadata for each file
        return {
            name: file.name,
            metadata: {
                size: metadata.size,
                contentType: metadata.contentType,
                createdAt: metadata.timeCreated,
                uploadedBy: metadata.metadata ? metadata.metadata.uploadedBy : undefined // Check if custom metadata exists
            }
        };
    }));

    return filesInfo;
}
app.post('/api/files', async (req, res) => {
    const prefix = `${req.body.course}/${req.body.semester}/`;
    try {
        const files = await listFilesInFolder(prefix);
        res.json(files);
    } catch (error) {
        console.error('Failed to list files:', error);
        res.status(500).send('Failed to retrieve files');
    }
});

app.post('/api/download', async (req, res) => {
    const filePath = req.body.filePath; 
    try {
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        if (!exists) {
            return res.status(404).send('File not found');
        }

        const [metadata] = await file.getMetadata();
        res.type(metadata.contentType);
        res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(metadata.name) + '"');

        file.createReadStream()
            .on('error', (error) => {
                console.error('Error downloading file:', error);
                res.status(500).send('Error downloading file');
            })
            .on('end', () => {
                res.end(); 
            })
            .pipe(res); 
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT} ...`);
});


