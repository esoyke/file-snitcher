// npm install execSync
// meteor add lookback:tooltips

async = Npm.require('execSync');
fs = Npm.require('fs');

Meteor.publish('files', function() {
  var self = this;
  
  var log = console.log.bind(console);

  // TODO- make this thing dynamic, set from client. Would want to make the
  // value specific to the user requesting it
  var getFolder = function getFolder() {
   return '/tmp2';
  }

  //var folderLoc = chokidar.watch(globalWatchLocation, {
  var watcher = chokidar.watch(getFolder(), {
    ignored: /[\/\\]\./,
    persistent: true
  });

  /*
   * We have to wrap the callback functions in Meteor.bindEnvironment() because
   * all functions have to run withing a Fiber, and the callback here breaks
   * that.  Wrapping it sets up the Fiber as well as some other "housekeeping"
   * tasks.
   *
   * TODO- allow specification of excluded directory(ies). For instance I don't
   * care to see every file changed/deleted in JBoss' /tmp or /work dirs. This
   * should be configurable by changing the ignored param of the chokidar watcher.
   *
   */

  /* I suspect there might be a bug in the chokidar library. When I rm a file, then
   * touch it again, even though the file is 'added', the raw event info still says 'deleted'
   * and it is not reflected on the client that it was re-added until a second touch is done.
   */
  //watcher.on('raw', function(event, path, details) { log('Raw event info:', event, path, details); })


  watcher.on('add', Meteor.bindEnvironment(function(path, stats) {
    console.log('Adding file: '+path);
      var loggedInUsers = getUsers();
      self.added('files', path, {
        'type': 'FILE',
        created_on: stats && stats.ctime ? stats.ctime : fs.statSync(path).ctime,
        modified_on: stats && stats.mtime ? stats.mtime : fs.statSync(path).mtime,
        accessed_on: stats && stats.atime ? stats.atime : fs.statSync(path).atime,
        contents: stats && stats.isFile() ? fs.readFileSync(path) : null,
        loggedInUsers: loggedInUsers  });
      // the reason we are not seeing a re-created file until it has been touched TWICE
      // is that for some weird reason the server is not publishing it the first time??
  }, function(err) { console.log(err); }));

  watcher.on('addDir', Meteor.bindEnvironment(function(path, stats) {
    var loggedInUsers = getUsers();
    self.added('files', path, {
      'type': 'DIR',
      created_on: stats && stats.ctime ? stats.ctime : fs.statSync(path).ctime,
      modified_on: stats && stats.mtime ? stats.mtime : fs.statSync(path).mtime,
      accessed_on: stats && stats.atime ? stats.atime : fs.statSync(path).atime,
      contents: null,
      loggedInUsers: loggedInUsers });
  }, function(err) { console.log(err); }));

  watcher.on('change', Meteor.bindEnvironment(function(path, stats) {
    var loggedInUsers = getUsers();
    self.changed('files', path, {
      'type': 'FILE',
      created_on: stats && stats.ctime ? stats.ctime : fs.statSync(path).ctime,
      modified_on: stats && stats.mtime ? stats.mtime : fs.statSync(path).mtime,
      accessed_on: stats && stats.atime ? stats.atime : fs.statSync(path).atime,
      contents: stats && stats.isFile() ? fs.readFileSync(path) : null ,
      changed: Date(),
      loggedInUsers: loggedInUsers });
  }, function(err) { console.log(err); }));

  watcher.on('unlink', Meteor.bindEnvironment(function(path) {
    console.log('Deleted file: '+path);
    var loggedInUsers = getUsers();
     // rather than remove, we actually set as changed to forensically retain it
     self.changed('files', path, {
      'type': 'FILE',
      deleted: Date(),
      loggedInUsers: loggedInUsers });
  }, function(err) { console.log(err); }));

  watcher.on('unlinkDir', Meteor.bindEnvironment(function(path) {
    console.log('Deleted dir: '+path);
    var loggedInUsers = getUsers();
    // self.removed('files', path);
    self.changed('files', path, {
      'type': 'DIR',
      deleted: Date(),
      loggedInUsers: loggedInUsers });
  }, function(err) { console.log(err); }));

  self.onStop(function() {
    watcher.close();
  });

  /* 
  * Returns the user(s) logged into the system at time of the call (*nix only)
  */
  getUsers = function(){
    var res = async.exec("who| sed 's/|/ /' | awk '{print $1, $8}'|uniq");
    var users = res.stdout.replace(/(\r\n|\n|\r)/gm," ");
    return users;
  }

});


// TODO- get this working or shitcan it. Also need to be sure the update 
//to server only affects that user's session. Investigate server sessions.
// Meteor.publish('watchLocation', function() {
//    return WatchLocCollection.find();
// });
