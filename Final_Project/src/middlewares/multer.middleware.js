import multer from "multer";

const storage = multer.diskStorage({
  // request contains the json data sent from the client , file contains the file sent from the client
  destination: function (req, file, cb) {
    // cb stands for callback

    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // originalname is the name of the file on the client's computer
    //original name is not recommended to be used as the file name on the server
    //because it might be the same as the name of another file in the destination folder
    //so we can use a unique name for the file on the server
  },
});

export const upload = multer({ storage });
