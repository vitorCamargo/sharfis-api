const express = require('express'); // first of all import express

const File = require('../models/file'); // link route in the models
const User = require('../models/user'); // link route in the models

const router = express.Router(); // express tool for make the route 'requires'

router.get('/', (req, res) => {
  File.getAllFiles((err, files) => {
    if (err) {
      console.log(err);
      res.status(400).send('Can\'t find a file/directory \n');
    }

    res.status(200).json(files);
  });
});

router.get('/:id', (req, res) => {
  File.getFileById(req.params.id, (err, file) => {
    if (err) {
      console.log(err);
      res.status(400).send('Can\'t find a file/directory \n');
    }

    res.status(200).json(file);
  });
});

router.get('/directory/:directory', (req, res) => { // get file by directory
  let response = [];
  File.getFileById(req.params.directory, (err, file) => { // get te directory for the child's
    if (err) {
      console.log(err);
      res.status(400).send('Can\'t find a file with this directory_Id \n');
    }

    if (file.type === 2) {
      res.status(400).send('This is not a directory \n');
    }
    const tam = file.children.length;
    file.children.forEach((children, index) => {
      File.getFileById(children, (errr, files) => {
        if (errr) {
          console.log(err);
          res.status(400).send('Can\'t get a file \n');
        }
        response = response.concat(files);
        if (index === tam - 1) {
          res.status(200).json(response);
        }
      });
    });
  });
});

router.get('/fileId/:fileId', (req, res) => { // get file by Id
  File.getFileById(req.params.fileId, (err, file) => {
    if (err) {
      console.log(err);
      res.status(400).send('Can\'t find a file with this Id #1 \n');
    }
    res.status(200).json(file);
  });
});

router.get('/fileName/:fileName', (req, res) => { // get file by name
  File.getFileByName(req.params.fileName, (err, file) => {
    if (err) {
      console.log(err);
      res.status(400).send('Can\'t find a file with this name #1 \n');
    }
    if (file[0].type === 1) {
      res.status(400).send('Can\'t find a file with this name #2 \n');
    } else {
      res.status(200).json(file);
    }
  });
});

router.get('/dirName/:dirName', (req, res) => { // get directory by name
  File.getFileByName(req.params.dirName, (err, file) => {
    if (err) {
      console.log(err);
      res.status(400).send('Can\'t find a dir with this name \n');
    }
    res.status(200).json(file);
  });
});

router.post('/', (req, res) => {
  const {
    name, file, father, type, owner, shared_with
  } = req.body;

  const newFile = {};

  newFile.name = name;
  newFile.file = file;
  newFile.father = father;
  newFile.type = type;
  newFile.owner = owner;
  newFile.shared_with = shared_with;

  File.addFile(newFile, (err, fileRes) => {
    if(err) {
      console.log(err);
      res.status(400).send('Can\'t create the File \n');
    }

    File.getFileById(father, (errFather, fileFather) => {
      if(errFather) {
        console.log(errFather);
        res.status(400).send('Can\'t create the File \n');
      }

      const updateFile = {};
      updateFile.children = fileFather.children.concat(fileRes._id);
      File.updateFile(father, updateFile, (errorFather) => {
        if (errorFather) {
          console.log(errorFather);
          res.status(400).send('Can\'t create the File \n');
        }
      });
    });
    res.status(200).json(fileRes);
  });
});

router.put('/', (req, res) => {
  const {
    name, file, father, children, owner, shared_with, id
  } = req.body; // sugar sintax

  const updatedFile = {};

  updatedFile.name = name;
  updatedFile.file = file;
  updatedFile.father = father;
  updatedFile.children = children;
  updatedFile.owner = owner;
  updatedFile.shared_with = shared_with;

  File.updateFile(id, updatedFile, (err, fileResponse) => {
    if (err) {
      console.log(err);
      res.status(400).send('Can\'t update this file \n');
    }
    res.status(200).json(fileResponse);
  });
});

router.put('/move', (req, res) => {
  const {
    idChild, idFather
  } = req.body;

  File.getFileById(idChild, (err, file) => {
    if(err || !idFather || !file) {
      console.log(err);
      res.status(400).send('Can\'t move this file \n');
    } else {
      File.moveFile(file, idFather, (error, fileResponse) => {
        if (error) {
          console.log(err);
          res.status(400).send('Can\'t move this file \n');
        }

        res.status(200).json(fileResponse);
      });
    }
  });
});

router.put('/sharing', (req, res) => {
  const {
    shared_with, id
  } = req.body;

  const updatedFile = {};
  updatedFile.shared_with = shared_with;

  File.updateFile(id, updatedFile, (err, fileResponse) => {
    if(err) {
      console.log(err);
      res.status(400).send('Can\'t update this file \n');
    }

    for(var i = 0; i < shared_with.length; i++) {
      User.findOne({ _id: shared_with[i] }, (errUser, user) => {
        if(!err) {
          user.files_shared = user.files_shared.concat([id]);
        }
      });
    }

    res.status(200).json(fileResponse);
  });

  File.getFileById(id, (err, file) => {
    if(err || !file) {
      console.log(err);
      res.status(400).send('Can\'t move this file \n');
    } else {
      File.moveFile(file, idFather, (error, fileResponse) => {
        if (error) {
          console.log(err);
          res.status(400).send('Can\'t move this file \n');
        }

        res.status(200).json(fileResponse);
      });
    }
  });
});

router.delete('/:id', (req, res) => {
  File.getFileById(req.params.id, (err, file) => {
    if (err || file.father === null || !file) {
      console.log(err);
      res.status(400).send('Can\'t delete this file \n');
    } else {
      File.deleteFile(file, (error, fileResponse) => {
        if (error) {
          console.log(err);
          res.status(400).send('Can\'t delete this file \n');
        }

        res.status(200).json(fileResponse);
      });
    }
  });
});

module.exports = router;
