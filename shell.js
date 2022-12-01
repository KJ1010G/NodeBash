import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import os from 'node:os';
import process from 'node:process';
import fs from 'node:fs';

const rl = readline.createInterface({ input, output });

// set cwd to user's home dir
process.chdir(os.homedir());

while (true) {
  let command = await rl.question('> ');
  let commandArr = command.split(' ');

  if (commandArr[0] == 'exit' && commandArr.length == 1) {
    rl.close(); // application will not terminate until the readline.Interface is closed
    break;
  }
  else if (commandArr[0] == 'pwd' && commandArr.length == 1) {
    console.log(process.cwd());
  }
  else if (commandArr[0] == 'cd') {
    cd(commandArr);
  }
  else if (commandArr[0] == 'ls') {
    ls(commandArr);
  }
  else if (commandArr[0] == 'fg') {
    fg(commandArr);
  }
  else { // search for executable
    pathToBinary(commandArr);
  }
}

function cd(cmdArr) {
  if (cmdArr.length == 1) {
    process.chdir(os.homedir());
  }
  else if (cmdArr.length == 2) {
    try {
      process.chdir(cmdArr[1]);
    } catch (err) {
      console.error(`chdir: ${err}`);
    }
  }
  else {
    console.error(`error: cd: too many arguments`);
  }
}

function ls(cmdArr) {
  let contents;
  
  // get contents
  if (cmdArr.length == 1) {
    contents = fs.readdirSync('.');
  }
  else if (cmdArr.length == 2) {
    try {
      contents = fs.readdirSync(cmdArr[1]);
    } catch (err) {
      console.error(`error: ls: ${err}`);
      return;
    }
  }
  else {
    console.error(`error: ls: too many arguments, this shell only supports one argument for ls`);
    return;
  }

  // print contents
  contents.forEach(file => {
    console.log(file);
  });
}

function fg(cmdArr) {

}

function pathToBinary(cmdArr) {

}