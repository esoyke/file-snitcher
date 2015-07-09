// npm install execSync
sync = Npm.require('execSync');
fs = Npm.require('fs');
Fiber = Npm.require('fibers');

Meteor.publish("watchLocation", function() {
    console.log("watchLocation in collection: "+WatchLocCollection.find().location);
    return WatchLocCollection.find();
});

Meteor.publish('files', function() {
  var self = this;
  
  var log = console.log.bind(console);

  /* 
  * Returns the user(s) logged into the system at time of the call (currently supports *nix only)
  */
  getUsers = function(){
    var res = sync.exec("who| sed 's/|/ /' | awk '{print $1, $8}'|uniq");
    var users = res.stdout.replace(/(\r\n|\n|\r)/gm,"");
    return users.trim();
  }

  /* Persists activity to snitcher.log in user's Home dir */
  writeLog = function(data) {
    fs.appendFile(getUserHome()+"/snitcher.log", data+'\n', function(err) {
        if(err) {
            return console.log(err);
        }
    }); 
  }
  /* Find Home dir in platform agnostic manner */
  getUserHome = function () {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  }

  /*
   * TODO- allow specification of excluded directory(ies). For instance I don't
   * care to see every file changed/deleted in JBoss' /tmp or /work dirs. This
   * should be configurable by changing the ignored param of the chokidar watcher.
   */
  var watcher = chokidar.watch(Meteor.call('getWatchFolder'), {
    ignored: /[\/\\]\./,
    persistent: true
  });


  var watchLocation = Meteor.call('getWatchFolder');  
  // until I figure out how to tell the watcher to re-load from within the startup method,
  // just poll every few seconds to see if client changed the watch location
  (function checkWatchLocation() {
    Fiber(function() {
      var tmp = Meteor.call('getWatchFolder');      
      if(tmp !== watchLocation){
        log('folder changed to '+tmp+', updating watcher..');
        // this is doing nothing unless you refresh the browser?
        watcher.close();
        watcher = chokidar.watch(tmp, {
          ignored: /[\/\\]\./,
          persistent: true
        });
        writeLog('-- Watch location changed to '+watchLocation+' at '+Date());
      }
      watchLocation = tmp;
      setTimeout( checkWatchLocation, 1000 );
    }).run();
  })();

  /*
   * We have to wrap the callback functions in Meteor.bindEnvironment() because
   * all functions have to run withing a Fiber, and the callback here breaks
   * that.  Wrapping it sets up the Fiber as well as some other "housekeeping"
   * tasks.
   *
   * I suspect there might be a bug in the chokidar library. When I rm a file, then
   * touch it again, even though the file is 'added', the raw event info still says 'deleted'
   * and it is not reflected on the client that it was re-added until a second touch is done.
   */
  //watcher.on('raw', function(event, path, details) { log('Raw event info:', event, path, details); })

  watcher.on('add', Meteor.bindEnvironment(function(path, stats) {
      var loggedInUsers = getUsers();
      self.added('files', path, {
        'type': 'FILE',
        created_on: stats && stats.ctime ? stats.ctime : fs.statSync(path).ctime,
        modified_on: stats && stats.mtime ? stats.mtime : fs.statSync(path).mtime,
        accessed_on: stats && stats.atime ? stats.atime : fs.statSync(path).atime,
        contents: stats && stats.isFile() ? fs.readFileSync(path) : null,
        loggedInUsers: loggedInUsers  });
      if(!Meteor.call('isStartupFile', path)){
        console.log('Adding file: '+path);
        writeLog('A '+Date()+' '+path+' ('+loggedInUsers+')');
      }
      else {
        console.log('Discovered pre-existing file: '+path);
      }
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
    if(!Meteor.call('isStartupFile', path)){
      console.log('Adding file: '+path);
      writeLog('A '+Date()+' '+path+' ('+loggedInUsers+')');
    }
    else {
      console.log('Discovered pre-existing dir: '+path);
    }
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
    console.log('Changed file: '+path);
    writeLog('C '+Date()+' '+path+' ('+loggedInUsers+')');
  }, function(err) { console.log(err); }));

  watcher.on('unlink', Meteor.bindEnvironment(function(path) {
    var loggedInUsers = getUsers();
     // rather than remove, we actually set as changed to forensically retain it
     self.changed('files', path, {
      'type': 'FILE',
      deleted: Date(),
      loggedInUsers: loggedInUsers });
     console.log('Deleted file: '+path);
     writeLog('D '+Date()+' '+path+' ('+loggedInUsers+')');
  }, function(err) { console.log(err); }));

  watcher.on('unlinkDir', Meteor.bindEnvironment(function(path) {
    var loggedInUsers = getUsers();
    // self.removed('files', path);
    self.changed('files', path, {
      'type': 'DIR',
      deleted: Date(),
      loggedInUsers: loggedInUsers });
    console.log('Deleted dir: '+path);
    writeLog('D '+Date()+' '+path+' ('+loggedInUsers+')');  
  }, function(err) { console.log(err); }));

  self.onStop(function() {
    watcher.close();
  });


});

