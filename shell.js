import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import os from 'node:os';
import process from 'node:process';

const rl = readline.createInterface({ input, output });

// set cwd to user's home dir
try {
  process.chdir(os.homedir());
} catch (err) {
  console.error(`chdir: ${err}`);
  process.exit(1);
}

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

function cd(params) {
  
}

function ls(params) {
  
}

function fg(params) {
  
}

function pathToBinary(params) {
  
}