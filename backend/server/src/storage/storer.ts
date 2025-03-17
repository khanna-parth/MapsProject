import multer from "multer";
import fs from 'fs';
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadFolder = req.body.folder || 'uploads';
  
      const folderPath = path.join(__dirname, uploadFolder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
  
      cb(null, folderPath);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const getMatchingFiles = (dir: string, keyword: string) => {
    const files = fs.readdirSync(dir);
    const filteredFiles = files.filter(file => file.split(".")[0].split("_")[0] == keyword);
    console.log(`Found: ${filteredFiles} for username: ${keyword}`)
    return filteredFiles;
}

const deleteExistingAvatar = (keyword: string) => {
    const dir = "src/storage/uploads/avatars";
    const files = fs.readdirSync(dir);
    const filteredFiles = files.filter(file => file.includes(keyword));
    // console.log(filteredFiles);
    filteredFiles.forEach((file) => {
        fs.unlink(`src/storage/uploads/avatars/${file}`, (err) => {
            if (err) {
                // console.error('Error deleting file:', err);
                return;
            }
            // console.log('File deleted successfully!');
        });
    })
    return filteredFiles;
}


const getImage = async (path: string) => {
    try {
        const imageBuffer = await fs.promises.readFile(path);
        return imageBuffer;
      } catch (error) {
        console.error("Error reading image:", error);
        throw error;
      }
}

const imageToBase64 = (imagePath: string) => {
    try {
        const absolutePath = path.resolve(imagePath);
        const imageBuffer = fs.readFileSync(absolutePath);
        const base64String = imageBuffer.toString('base64');
        const mimeType = getMimeType(imagePath);
        return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
        console.error("Error reading or encoding image:", error);
        return null;
    }
}

const getAvatarBase64 = (username: string) => {
    const avatarPath = "src/storage/uploads/avatars";
    const files = getMatchingFiles(avatarPath, username);
    if (!files || files.length == 0) {
        return "";
    }
    const imgData = imageToBase64(`${avatarPath}/${files[0]}`)
    return imgData;
}
  
const getMimeType = (imagePath: string) => {
    const ext = path.extname(imagePath).toLowerCase();
    switch (ext) {
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        case '.webp': return 'image/webp';
        default: return 'application/octet-stream';
    }
}

const uploadFile = (filePath: string) => {
    return multer({
      storage: multer.diskStorage({
        destination: function (req, file, cb) {
          const dir = path.dirname(filePath);
  
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
  
          cb(null, dir);
        },
        filename: function (req, file, cb) {
          const fileName = path.basename(filePath);
          cb(null, fileName);
        }
      })
    });
  };

const uploadAvatar = (userID: string) => {
    return multer({
        storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const dir = path.join('src/storage/uploads/avatars');

            if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            }

            deleteExistingAvatar(userID);

            cb(null, dir);
        },
        filename: function (req, file, cb) {
            const originalExt = path.extname(file.originalname);
            const fileName = `${userID}_avatar${originalExt}`;

            cb(null, fileName);
        }
        })
    });
};

export { getImage, getAvatarBase64, uploadFile, uploadAvatar };