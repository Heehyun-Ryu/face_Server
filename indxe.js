const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload_json = JSON.parse(fs.readFileSync("./photo.json", "utf-8"));
const classificaion_json = JSON.parse(fs.readFileSync("./classification.json", "utf-8"));

// const upload = multer({
//     storage: multer.diskStorage({
//         destination: (req, file, cb) => {
//             let keynum = req.params.keynum;
//             let dir = 'upload/' + keynum;
//             if(!fs.existsSync(dir)){
//                 fs.mkdirSync(dir);
//                 cb(null, dir);
//             }
//             filename: (req, file, cb) => {
//                 if(file.fieldname === "location_images"){
//                     cb(null, '위치' + Date.now() + Path.extname(file.originalname));
//                 }
//             }
//         }
//     })
// });

const upload = multer({
    storage: multer.diskStorage({
        destination: 'upload/',
        filename: (req, file, cb) => {
            console.log(file);
            cb(null, Date.now() + path.extname(file.originalname));
        }
    })
});

// const fileUpload = upload.fields([
//     {name: 'location_image'},
// ]);
// app.post('/api/uploadImg/:keynum', fileUpload, function (req, res) {
//     var dir = 'upload/' + req.params.keynum;
//     if (!fs.existsSync(dir)) { fs.mkdirSync(dir) };
//     var upload_date = req.body.upload_date;

//     attractionModel.find({ key: req.params.keynum }, (err, att) => {
//         var id = att[0]._id;
//         attractionModel.findByIdAndUpdate(id, {
//             $set: {
//                 upload_date: upload_date
//             }
//         }).exec();
//     });

//      var count = 0;
//     res.status(200).json({ 'uploaded_images_count': count });
// });

// app.post('/upload', upload.single("image"), (req, res) => {
//     res.send('Image Uploaded');
// });

//upload images limit 10.
app.post('/upload', upload.array("image", 10), (req, res) => {
    console.log(req.files);
    res.send('Files uploaded!');
});

//accese the photo through '/example/cat.jpg'
app.use('/example', express.static('upload'));

//accese the photo through '/exam/classification/cluster1/cat.jpg
app.use('/exam', express.static('classification'));

//update upload folder and new release photo.json
function exportImagesToJson(){
    const uploadPath = path.join(__dirname, 'upload');
    const pictures= []

    fs.readdirSync(uploadPath).forEach((pi) => {
        if(pi.endsWith('.jpg') || pi.endsWith('.png')){
            pictures.push({filename: pi, path: `/upload/${pi}`});
        }
    });

    const jsonContent = JSON.stringify(pictures, null, 2);
    console.log(path.join(__dirname, 'photo.json'));
    // fs.writeFileSync(path.join(__dirname, '/upload', 'photo.json'), jsonContent);    //infinity loop
    fs.writeFileSync(path.join(__dirname, 'photo.json'), jsonContent);

    console.log('images export to json');
}

//update classification folder and new release classification.json
function exportImagesToJson_classification(){
    const classification_path = path.join(__dirname, 'classification');
    const clusters = [];

    fs.readdirSync(classification_path).forEach((folder) => {
        console.log(folder);
        imgList = [];

        fs.readdirSync(path.join(__dirname, 'classification', folder)).forEach((img) => {
            // img = img.split(' ').join('');
            console.log(img);
            if(img.endsWith('.jpg') || img.endsWith('.png')){
                imgList.push({name: img, path: `/classificaion/${folder}/${img}`});
            }
            
        })
        clusters.push({[folder]: imgList});
    });

    console.log(clusters);
    
    const jsonFile = JSON.stringify(clusters, null, 2);
    console.log(path.join(__dirname, 'classification'));
    console.log(jsonFile);
    fs.writeFileSync(path.join(__dirname, `classification.json`), jsonFile);
}
// exportImagesToJson_classification();

// detect folder update and notify
fs.watch(`./classification`, {recursive: true}, (eventType, filename) => {
    console.log(`File ${filename} has been ${eventType}`);
    exportImagesToJson_classification();
});

//detect folder update and notify
fs.watch('./upload', {recursive: false}, (eventType, filename) => {
    console.log(`File ${filename} has been ${eventType}`);
    exportImagesToJson();
});

app.use(express.json());

app.get("/point", (req, res) => {
    // res.send('fuck you');
    res.json(upload_json);
});

app.get("/classify", (req, res) => {
    res.json(classificaion_json);
})

app.listen(8080, () => {
    console.log('listen on 8080');
})

app.get('/', (req, res) => {
    res.send('hello this is face_server');
})