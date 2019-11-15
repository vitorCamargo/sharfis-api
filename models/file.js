const mongoose = require('mongoose');

const { Schema } = mongoose;

const User = require('./user');

const FileSchema = new Schema({
  name: { type: String },
  file: { type: Object },
  father: { type: Schema.Types.ObjectId, ref: 'File' },
  children: [{ type: Schema.Types.ObjectId, ref: 'File', default: [] }],
  type: { type: Number, required: true }, // 1 - Directory 2 - File
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  isRoot: { type: Boolean, default: false },
  shared_with: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
}, { timestamps: true });

const File = mongoose.model('File', FileSchema, 'Files');

module.exports = File;

module.exports.getRootSystem = (callback) => {
  File.findOne({ type: 0, isRoot: true }, callback);
};

// Search All Files
module.exports.getAllFiles = (callback) => {
  File.find(callback);
};

// Search File By Id
module.exports.getFileById = (id, callback) => {
  File.findOne({ _id: id }, callback);
};

// Search File By Name
module.exports.getFileByName = (searchName, callback) => {
  File.find({
    $or: [
      { name: new RegExp(searchName, 'i') }
    ]
  }, callback);
};

// Search File By Id
module.exports.getFileById = (id, callback) => {
  File.findOne({ _id: id }, callback);
};

// Create File
module.exports.addFile = (FileDir, callback) => {
  const newFile = new File();

  newFile.name = FileDir.name;
  newFile.file = FileDir.file;
  newFile.father = FileDir.father;
  newFile.type = FileDir.type;
  newFile.owner = FileDir.owner;

  File.findOne({ _id: fileDir.father }, (err, file) => {
    if(!err && file) {
      newFile.shared_with = file.shared_with;
    }
  });

  newFile.save(callback);
};

// Move File
module.exports.moveFile = (file, idFather, callback) => {
  const idChild = file._id;

  File.findOne({ _id: file.father }, (errChildFather, resChildFather) => {
    if(errChildFather) callback(errChildFather, null);

    File.findOne({ _id: idFather }, (errFather, resFather) => {
      if(errFather) callback(errFather, null);

      const indexFather = resChildFather.children.map(e => (e ? e.toString() : '')).indexOf(idChild.toString());

      if(indexFather > -1) {
        const updatedFile = {};
        resChildFather.children.splice(indexFather, 1);
        updatedFile.children = resChildFather.children;

        File.updateFile(resChildFather._id, updatedFile);
      }

      const updatedFileFather = {};
      updatedFileFather.children = resFather.children.concat(idChild);

      File.updateFile(resFather._id, updatedFileFather);

      const updateFileChild = {};
      updateFileChild.father = idFather;

      const shared_with = file.shared_with.concat(resFather.shared_with)
      updateFileChild.shared_with = shared_with.filter((r, i) => shared_with.indexOf(r) === i);

      File.updateFile(idChild, updateFileChild, (errChild, resChild) => {
        if(errFather) callback(errChild, null);

        for(var i = 0; i < resChild.shared_with.length; i++) {
          User.findOne({ _id: resChild.shared_with[i] }, (errUser, user) => {
            if(!errUser && user) {
              const shared_files = user.shared_files.concat([resChild._id]);
              user.shared_files = shared_files.filter((r, i) => shared_files.indexOf(r) === i);
              user.save();
            }
          });
        }

        callback(null, resChild);
      });
    });
  });
};

// Update File
module.exports.updateFile = (id, updatedFile, callback) => {
  File.getFileById(id, (err, file) => {
    if (err) callback(err, null);

    file.name = updatedFile.name ? updatedFile.name : file.name;
    file.file = updatedFile.file ? updatedFile.file : file.file;
    file.father = updatedFile.father ? updatedFile.father : file.father;
    file.children = updatedFile.children ? updatedFile.children : file.children;
    file.type = updatedFile.type ? updatedFile.type : file.type;
    file.owner = updatedFile.owner ? updatedFile.owner : file.owner;
    file.shared_with = updatedFile.shared_with ? updatedFile.shared_with : file.shared_with;

    file.save(callback);
  });
};

// Delete File
module.exports.deleteFile = async (file, callback) => {
  const children = [file._id];
  let index = 0;

  while(children.length > index) {
    const res = await File.findOne({ _id: children[index] }).exec();

    if(res._id !== null) {
      res.children.forEach((element) => {
        children.push(element);
      });
    }
    index += 1;
  }

  File.findOne({ _id: file.father }, (err, fileFather) => {
    if(err) callback(err, null);

    const indexFather = fileFather.children.map(e => e.toString()).indexOf(file._id.toString());

    if (indexFather > -1) {
      const updatedFile = {};
      fileFather.children.splice(indexFather, 1);
      updatedFile.children = fileFather.children;

      File.updateFile(fileFather._id, updatedFile);
    }

    File.deleteMany({ _id: { $in: children } }, callback);
  });
};
