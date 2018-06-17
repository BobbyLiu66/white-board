const AWS = require('aws-sdk');
const bucketName = 'chat-picture';
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {Bucket: bucketName}
});

exports.uploadPhoto = async (data) => {
    const uploadParams = {Bucket: bucketName, Key: '', Body: '', ACL: 'public-read'};
    uploadParams.Body = data.photo;
    uploadParams.Key = `${data.nickname}.png`;

    return new Promise((resolve, reject) => {
        s3.upload(uploadParams, (err, data) => {
            if (err) reject({err:err});
            resolve({img:data.Location})
        })
    })
};