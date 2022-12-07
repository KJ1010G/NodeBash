import * as readline from 'node:readline';
import os from 'node:os';
import process from 'node:process';
import fs from 'node:fs';
import child_process from 'node:child_process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// set cwd to user's home dir
process.chdir(os.homedir());

let runningChilds = {};

let foregroundChildProcessId = null;

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
      process.exit();
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
    // else if (commandArr[0] == 'jobs') {
    //   Object.keys(runningChilds).forEach((pid) => {
    //     console.log(pid);
    //     console.log(runningChilds[pid].connected);
    //   });
    // }
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


let justRanFg = false;
function fg(cmdArr) {

  if (cmdArr.length != 2) {
    console.log("fg expects just pid as its argument");
  }
  if (foregroundChildProcessId == null) {
    if (runningChilds[cmdArr[1]]) {

      // CLEAR STDIN BUFFER
      justRanFg = true; // so that child does not get this input

      foregroundChildProcessId = cmdArr[1];
    }
    else {
      console.log('Invalid pid');
      setTimeout(() => {
        askAndHandleCommand();
      }, 100);
    }
  }
  else {
    console.log('foreground is not null, this is unexpected');
  }
}

function pathToBinary(cmdArr) {

  const childBinary = child_process.spawn(cmdArr[0], cmdArr.slice(1), {
    // shell: true,
    // stdio: 'inherit',
    stdio: ['pipe', 'inherit', 'inherit']
  });

  let successfullySpawned = false;

  childBinary.on('spawn', () => {
    successfullySpawned = true;
    foregroundChildProcessId = childBinary.pid;
    console.log(`pid = ${foregroundChildProcessId}`);
    runningChilds[childBinary.pid] = childBinary;
  });

  childBinary.on('error', (err) => {
    console.error(`${cmdArr[0]}: error: ${err.message}`);
  });

  childBinary.on('close', (code) => {
    console.log(`command ${cmdArr[0]} exited with code ${code}`);
    delete runningChilds[childBinary.pid];
    if ( foregroundChildProcessId != null && foregroundChildProcessId == childBinary.pid) {
      foregroundChildProcessId = null;
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

  childBinary.on('exit', (code) => {
    console.log(`exit event recieved on child process id : ${childBinary.pid}`);
  });

}

process.stdin.on('data', (data) => {
  if (foregroundChildProcessId != null) {
    if (justRanFg) { // ignore the input
      justRanFg = false;
      return;
    }
    runningChilds[foregroundChildProcessId].stdin.write(data);
  }
});

// code to handle ctrl+c
process.on('SIGINT', () => {
  console.log('Received SIGINT.');
  if (foregroundChildProcessId) {
    // NO NEED TO DO ANYTHING, FOREGROUND PROCESS WILL RECEIVE SIGINT AUTOMATICALLY
    // AS IT ALSO RECEIVES CTRL+C INPUT
  }
  else {
    releaseResources();
    process.exit();
  }
});

// code to handle ctrl+z
process.on('SIGTSTP', () => {
  console.log('Received SIGTSTP.');
  if (foregroundChildProcessId) { 
    // RUNNING PROGRAM RECEIVES CTRL + Z TOO AND HENCE IS STOPPED
    // WE WANT IT TO CONTINUE RUNNING BUT JUST IN BACKGROUND
    // SO WE GIT IT A SIGNAL TO CONTINUE
    runningChilds[foregroundChildProcessId].kill('SIGCONT');

    console.log(`Pid : ${foregroundChildProcessId}`);
    foregroundChildProcessId = null;
    setTimeout(() => {
      askAndHandleCommand();
    }, 100);
  }
  else {
    // stop the parent process.
    process.kill(process.pid, 'SIGSTOP');
  }
});


//--------------

// start with asking for command
setTimeout(() => {
  askAndHandleCommand();
}, 0);