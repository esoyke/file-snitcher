# FileSnitcher

A file-monitoring app built on mbabauer's pub/sub <a href="https://github.com/mbabauer/meteor_publicationsDemo">demo</a> leveraging <a href="https://github.com/paulmillr/chokidar">chokidar's</a> file wrapper.

File Snitcher records when files are added, changed, or removed, as well as the users logged into the system at the time (*nix/OSX supported).

## Usage
Clone repo, set desired watch directory in getFolder() method in server/publish/files.js, fire up meteor and browse to localhost:3000. 

Newly created files/directories display as green, changed as yellow, deleted as red, and those re-created (deleted then re-added and/or changed) as lightblue.<br>
<img src="public/legend_hor.png"/>

## TODO:
* Persist history, regardless of there being a client or not
* Make watch directory configurable from client
* Allow specification of excluded sub-directories
* Switch user listing to tooltips

## Issues:
* Re-created files (file deleted then created) only reflecting change after a SECOND touch. Still investigating.
* Might not display multiple logged-in users correctly (just saying this as this condition is yet to be tested).