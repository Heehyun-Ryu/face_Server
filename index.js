const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
var ip = require('ip');
const os = require('os');

const app = express();
const port = 8080;
const localIp = ip.address();
const wifiAddress = getWifiAddress();

// var ne = os.networkInterfaces()
// console.log(ne);
console.log(wifiAddress);

// console.log(ip.address());

if (!fs.existsSync("./upload")){
    fs.mkdirSync("./upload");
    console.log("create upload folder");
}

if(!fs.existsSync("./classification")){
    fs.mkdirSync("./classification");
    console.log("create classification folder");
}

if(!fs.existsSync("photo.json")){
    var data = "";
    fs.writeFileSync("photo.json", data);
    console.log("create photo.json file");
}

if(!fs.existsSync("classification.json")){
    var data = "";
    fs.writeFileSync("classification.json", data);
    console.log("create classification.json file");
}



exportImagesToJson();
exportImagesToJson_classification();

let upload_json = JSON.parse(fs.readFileSync("./photo.json", "utf-8"));
let classificaion_json = JSON.parse(fs.readFileSync("./classification.json", "utf-8"));


function getWifiAddress(){
    const network = os.networkInterfaces();

    for(const interfaceName in network){
        if(interfaceName === 'Wi-Fi'){
            const Info = network[interfaceName];

            console.log(Info);

            for(const Add of Info){
                if(Add.family === 'IPv4' && !Add.internal){
                    return Add.address;
                }
            }
        }        
    }
    return null;
}

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

//accese the photo through '/classification/cluster1/cat1.jpg
//EX) http://172.20.12.67:8080/classification/cluster1/cat2.jpg
app.use('/classification', express.static('classification'));

//update upload folder and new release photo.json
function exportImagesToJson(){
    const uploadPath = path.join(__dirname, 'upload');
    const pictures= {}
    const pictureList = []
    fs.readdirSync(uploadPath).forEach((pi) => {
        if(pi.endsWith('.jpg') || pi.endsWith('.png')){
            pictureList.push({filename: pi, path: `/upload/${pi}`});
        }
    });

    pictures['photo'] = pictureList;

    const jsonContent = JSON.stringify(pictures, null, 2);
    console.log(path.join(__dirname, 'photo.json'));
    // fs.writeFileSync(path.join(__dirname, '/upload', 'photo.json'), jsonContent);    //infinity loop
    fs.writeFileSync(path.join(__dirname, 'photo.json'), jsonContent);

    console.log('images export to json');
}

//update classification folder and new release classification.json
function exportImagesToJson_classification(){
    const classification_path = path.join(__dirname, 'classification');
    const clusters = {};

    fs.readdirSync(classification_path).forEach((folder) => {
        console.log(folder);
        imgList = [];

        fs.readdirSync(path.join(__dirname, 'classification', folder)).forEach((img) => {
            // img = img.split(' ').join('');
            imgs = img.split('.');
            console.log(imgs[0]);
            if(img.endsWith('.jpg') || img.endsWith('.png')){
                imgList.push({name: img.split('.')[0], path: `http://${wifiAddress}:${port}/classification/${folder}/${img}`});
            }
            
        })
        clusters[folder] = imgList;
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
    // exportImagesToJson();
    upload_json = JSON.parse(fs.readFileSync("./photo.json", "utf-8"));
    res.json(upload_json);
});

app.get("/classify", (req, res) => {
    classificaion_json = JSON.parse(fs.readFileSync("./classification.json", "utf-8"));
    res.json(classificaion_json);
})

app.listen(port, () => {
    console.log(`listen on ${port}`);
})

app.get('/', (req, res) => {
    res.send('hello this is face_server');
})