// npm install execSync
sync = Npm.require('execSync');
fs = Npm.require('fs');
Fiber = Npm.require('fibers');
path = Npm.require('path');


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
    var res = sync.exec("who|awk '{print $1, $8}'|uniq");
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

  resetWatcher = function(){
    // specify subfolder(s) to be ignored
    ignores = Meteor.call('getIgnoreSubFolders');
    ignorePath = "";
    if(ignores.length>0){
      _.map(ignores.split(','), function(data){
        // log("ignore: "+data);
        ignorePath+=Meteor.call('getWatchFolder')+'/'+data+'|';  // (trailing | won't hurt)
      });
      log('ignore sub folders: '+ignorePath);
    }
    return chokidar.watch(Meteor.call('getWatchFolder'), {
    // boiler plate chokidar ignore that ignores dot '.' files
    // ignored: /[\/\\]\./,

    // this ignores the subfolders tmp and work
    ignored: '/tmp2/tmp|/tmp2/work|',

    // ignored: path.resolve(Meteor.call('getWatchFolder')+'/**/ignore.js'), 
    // this works to ignore anything named work
    //ignored: path.resolve(Meteor.call('getWatchFolder')+'/**/work'), 

    persistent: true,

    // if this is set true existing files will not be shown at all. Uncommenting it will show
    // the existing at startup, but the work I did to scan the pre-existing files
    // will prevent them from looking 'new'
    //ignoreInitial: true
  });
  }

  var watcher = resetWatcher();

  var watchLocation = Meteor.call('getWatchFolder');  
  // until I figure out how to tell the watcher to re-load from within the startup method,
  // just poll every few seconds to see if client changed the watch location
  (function checkWatchLocation() {
    Fiber(function() {
      var tmp = Meteor.call('getWatchFolder');      
      if(tmp !== watchLocation){
        log('folder changed to '+tmp+', updating watcher..');
        // this is doing nothing unless you refresh the browser?
        watcher = resetWatcher();
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

