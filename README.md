<h1>NodeBash</h1>
<p>A minimal feature bash like shell, written in nodejs</p>
<h1>Requirements</h1>
<p>Create a bash like shell. When the shell is started, it should have default working directory set to user’s home directory. The term spawned process refers to the child processes created by the shell.js that you are going to write.</p>

<p>In this shell, following commands must work</p>
<ol>
<li><b>cd &lt;directory_name&gt;</b> - Should work same as bash shell.</li>
<li><b>pwd</b> - Prints current working directory.</li>
<li><b>ls &lt;directory_name&gt;</b> - Should work same as bash shell. Support for flags is not required.</li>
<li><b>&lt;path_to_binary&gt; &lt;args&gt;</b> - When path to a binary is provided, that binary should be spawned as a child process. The binary must receive all the arguments passed as space separated like arg1 arg2 ….</li>
<li><b>fg &lt;pid&gt;</b> - Brings the background process with process id <pid> to foreground.</li>
<li><b>exit</b> - Closes the shell.</li>
</ol>
<p>Following key combination should work the same as in shell:</p>
<ol>
<li><b>Ctrl + C</b> - Sends a SIGINT to the spawned process.</li>
<li><b>Ctril + Z</b> - Sends spawned process that is currently in foreground to the background. Prints it’s pid after setting the current process as background process.</li>
</ol>
<p>Shell must start with the following command:

```
> node shell.js
```
</p>

<h1>Test cases:</h1>
<ol>
<li>`&lt;path_to_node&gt; app.js` - Should run a NodeJS script named app.js in the current working directory of the app.</li>
</ol>