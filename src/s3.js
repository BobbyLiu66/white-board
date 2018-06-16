const AWS = require('aws-sdk');
const bucketName = 'chat-picture';
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {Bucket: bucketName}
});

exports.uploadPhoto = (data)=>{
    const uploadParams = {Bucket:bucketName, Key: '', Body: '', ACL: 'public-read'};
    uploadParams.Body = data.photo;
    uploadParams.Key = `${data.nickname}.${data.fileType}`;

    s3.upload (uploadParams,  (err, data) =>{
        if (err) {
            console.log("Error", err);
        } if (data) {
            console.log("Upload Success", data.Location);
        }
    });
};