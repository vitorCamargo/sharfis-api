const express = require('express'); // first of all import express

const File = require('../models/file'); // link route in the models

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
      // console.log(err);
      res.status(400).send('This is not a directory \n');
    }
    const tam = file.children.length;
    file.children.forEach((children, index) => {
      // console.log(children[0]);
      File.getFileById(children[0], (errr, files) => {
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
    name, file, father, children, type,  owner, group
  } = req.body; // sugar sintax

  const newFile = {};

  newFile.name = name;
  newFile.file = file;
  newFile.father = father;
  newFile.children = children;
  newFile.type = type;
  newFile.owner = owner;
  newFile.group = group;

  File.addFile(newFile, (err, fileRes) => {
    if (err) {
      console.log(err);
      res.status(400).send('Can\'t create the File \n');
    }
    File.getFileById(father, (errFather, fileFather) => {
      if (errFather) {
        console.log(errFather);
        res.status(400).send('Can\'t create the File \n');
      }

      const childrenFather = fileFather.children;
      childrenFather.push(fileRes._id);
      const updateFile = {};
      updateFile.children = childrenFather;
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
    name, file, father, children, type, owner, group, id
  } = req.body; // sugar sintax

  const updatedFile = {};

  updatedFile.name = name;
  updatedFile.file = file;
  updatedFile.father = father;
  updatedFile.children = children;
  updatedFile.type = type;
  updatedFile.owner = owner;
  updatedFile.group = group;

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
  } = req.body; // sugar sintax

  File.getFileById(idChild, (err, file) => {
    if (err || file.father.length === 0 || file._id === null) {
      console.log(err);
      res.status(400).send('Can\'t move this file \n');
    }

    File.moveFile(file, idFather, (error, fileResponse) => {
      if (error) {
        console.log(err);
        res.status(400).send('Can\'t move this file \n');
      }

      res.status(200).json(fileResponse);
    });
  });
});

router.delete('/:id', (req, res) => {
  File.getFileById(req.params.id, (err, file) => {
    if (err || file.father.length === 0 || file._id === null) {
      console.log(err);
      res.status(400).send('Can\'t delete this file \n');
    }

    File.deleteFile(file, (error, fileResponse) => {
      if (error) {
        console.log(err);
        res.status(400).send('Can\'t delete this file \n');
      }

      res.status(200).json(fileResponse);
    });
  });
});

module.exports = router;
