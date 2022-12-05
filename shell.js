import * as readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import os from 'node:os';
import process from 'node:process';
import fs from 'node:fs';
import child_process from 'node:child_process';
import tty from 'node:tty';

const rl = readline.createInterface({ input, output });

// set cwd to user's home dir
process.chdir(os.homedir());

let runningChilds = {};

let foregroundChildProcess = null;

function releaseResources() {
  rl.close(); // application will not terminate until the readline.Interface is closed
  // Maybe add code to close all background processes.
  Object.values(runningChilds).forEach((cp) => {
    if (cp) {
      cp.kill('SIGTERM');
    }
  });
}

function askAndHandleCommand() {
  rl.question('> ', (command) => {
    let askAgain = true;
    let commandArr = command.split(' ');
    if (commandArr[0] == 'exit' && commandArr.length == 1) {
      releaseResources();
      return;
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
      askAgain = false;
    }
    else if (commandArr[0] == '') {
      // ignore, cause this case causes error in path to binary function
    }
    else { // search for executable
      pathToBinary(commandArr);
      askAgain = false;
    }
    if (askAgain) {
      setTimeout(() => {
        askAndHandleCommand();
      }, 0);
    }
  });
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
      return;
    }
  }
  else {
    console.error(`error: cd: too many arguments`);
    return;
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
  // we need some data structure which links pid's to spawn returned variable.

  if (cmdArr.length != 2) {
    console.log("fg expects just pid as its argument");
  }
  if (foregroundChildProcess == null) {
    if (runningChilds[cmdArr[1]]) {
      foregroundChildProcess = runningChilds[cmdArr[1]];
    }
    else {
      console.log('Invalid pid');
      setTimeout(() => {
        askAndHandleCommand();
      }, 100);
    }
  }
  else {
    console.log('forground is not null, this is unexpected');
  }
}

function pathToBinary(cmdArr) {

  const childBinary = child_process.spawn(cmdArr[0], cmdArr.slice(1));

  let successfullySpawned = false;

  childBinary.on('spawn', () => {
    successfullySpawned = true;
    foregroundChildProcess = childBinary;
    runningChilds[childBinary.pid] = childBinary;
  });

  childBinary.on('error', (err) => {
    console.error(`${cmdArr[0]}: error: ${err.message}`);
  });

  childBinary.stdout.on('data', (data) => {
    // console.log(`stdout: ${data}`);
    process.stdout.write(`${data}`);
  });

  childBinary.stderr.on('data', (data) => {
    // console.error(`stderr: ${data}`);
    process.stderr.write(`${data}`);
  });

  childBinary.on('close', (code) => {
    console.log(`command ${cmdArr[0]} exited with code ${code}`);
    runningChilds[childBinary.pid] = undefined;
    if (foregroundChildProcess == childBinary) {
      foregroundChildProcess = null;
      setTimeout(() => {
        askAndHandleCommand();
      }, 100);
    }
    if (!successfullySpawned) {
      setTimeout(() => {
        askAndHandleCommand();
      }, 100);
    }
  });

}

process.stdin.on('data', (data) => {
  if (foregroundChildProcess != null) {
    if (String(data) == '\r') {
      foregroundChildProcess.stdin.write('\n');
    } else {
      foregroundChildProcess.stdin.write(data);
    }
  }
});

// for some reason, it is set on raw mode and ctrl+c does not run the handler in that
// so removing raw mode manually.
process.stdin.setRawMode(false);

// // code to handle ctrl+c
process.on('SIGINT', () => {
  console.log('Received SIGINT.');
  if (foregroundChildProcess) {
    // handle
    // send SIGINT to the forground process.
    foregroundChildProcess.kill('SIGINT');
  }
  else {
    releaseResources();
    process.exit();
  }
});

// code to handle ctrl+z
process.on('SIGTSTP', () => {
  console.log('Received SIGTSTP.');
  if (foregroundChildProcess) {
    // handle
    console.log(`Pid : ${foregroundChildProcess.pid}`);
    foregroundChildProcess = null;
    setTimeout(() => {
      askAndHandleCommand();
    }, 100);
  }
  else {
    // ignore for now...
    // ideally, the process should be temporarliy stopped somehow,
    // and control returned to bash(or whatever)
  }
});


//--------------


setTimeout(() => {
  askAndHandleCommand();
}, 0);