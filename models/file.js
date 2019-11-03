/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const FileSchema = new Schema({
  name: { type: String },
  file: { type: Object },
  father: [{ type: Schema.Types.ObjectId, ref: 'File' }],
  children: [[{ type: Schema.Types.ObjectId, ref: 'File' }]],
  type: { type: Number, required: true }, // 1 - Directory 2 - File
  owner: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  group: { type: String, required: true },
}, { timestamps: true });

const File = mongoose.model('File', FileSchema, 'Files');

module.exports = File;

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

// Create File
module.exports.addFile = (FileDir, callback) => {
  const newFile = new File();

  newFile.name = FileDir.name;
  newFile.file = FileDir.file;
  newFile.father.push(FileDir.father);
  newFile.children.push(FileDir.children);
  newFile.type = FileDir.type;
  newFile.owner.push(FileDir.owner);
  newFile.group = FileDir.group;

  newFile.save(callback);
};

// Move File
module.exports.moveFile = (file, idFather, callback) => {
  const idChild = file._id;
  const idChildFather = file.father[0];

  File.findOne({ _id: idChildFather }, (errChildFather, resChildFather) => {
    if (errChildFather) callback(errChildFather, null);

    File.findOne({ _id: idFather }, (errFather, resFather) => {
      if (errFather) callback(errFather, null);

      const indexFather = resChildFather.children.map(e => (e[0] ? e[0].toString() : '')).indexOf(idChild.toString());
      if (indexFather > -1) {
        const updatedFile = {};
        resChildFather.children.splice(indexFather, 1);
        updatedFile.children = resChildFather.children;
        File.updateFile(resChildFather._id, updatedFile);
      }

      const updatedFileFather = {};
      resFather.children.push(idChild);
      updatedFileFather.children = resFather.children;
      File.updateFile(resFather._id, updatedFileFather);

      const updateFileChild = {};
      updateFileChild.father = idFather;
      File.updateFile(idChild, updateFileChild, (errChild, resChild) => {
        if (errFather) callback(errChild, null);

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
    file.group = updatedFile.group ? updatedFile.group : file.group;

    file.save(callback);
  });
};

// Delete File
module.exports.deleteFile = async (file, callback) => {
  const children = [file._id];
  let index = 0;

  while (children.length > index) {
    const res = await File.findOne({ _id: children[index] }).exec();

    if (res._id !== null) {
      res.children.forEach((element) => {
        if (element.length === 0 || element[0] !== null) children.push(element[0]);
      });
    }
    index += 1;
  }

  File.findOne({ _id: file.father[0] }, (err, fileFather) => {
    if (err) callback(err, null);

    const indexFather = fileFather.children.map(e => e[0].toString()).indexOf(file._id.toString());

    if (indexFather > -1) {
      const updatedFile = {};
      fileFather.children.splice(indexFather, 1);
      updatedFile.children = fileFather.children;
      File.updateFile(fileFather._id, updatedFile);
    }

    File.deleteMany({ _id: { $in: children } }, callback);
  });
};
