
/**
 * Startup method to generate data in our collections
 */
Meteor.startup(function() {
  var log = console.log.bind(console);

  Meteor.methods({
          getWatchFolder: function () {
              return watchFolder;
          },
          /* returns listing of all files/dirs in the watchFolder */
          getFileListing: function() {
            // sadly fs module doesn't retrieve nested subdirs :(
            // return fs.readdirSync(Meteor.call('getWatchFolder'));  
            sFiles = sync.exec("find "+Meteor.call('getWatchFolder'));
            recursiveFileList = sFiles.stdout.split('\n');
            log('startup files: '+recursiveFileList);
            return recursiveFileList;
          },
          /* returns true if this item existed already at startup */
          isStartupFile: function(path){
            return false;
            //return _.contains(startingFiles, path);
          },       
          getIgnoreSubFolders: function(){
            return ignoreSubFolders;
          }

  });


  /* monitor for location updates from the client */
  WatchLocCollection.deny({
    insert: function (userId, item) {
      log('WatchLocCollection changed to '+item.location);
      watchFolder = item.location;
      //re-initialize pre-existing file listing
      startingFiles = Meteor.call('getFileListing');
    }
  });   

  var watchFolder = '/tmp2';
  var ignoreSubFolders = '';// CSV ex.: 'tmp,work';
  var startingFiles = Meteor.call('getFileListing');

  while (NormalCollection.find().count() < 1000) {
    var data = { created_on: new Date(), value: (Math.random() * 1000)};
    NormalCollection.insert(data);
  }

  SyncedCron.add({
    name: 'Normal Data Update',
    schedule: function(parser) {
      return parser.text('every 30 seconds');
    },
    job: function() {
      var data = { created_on: new Date(), value: (Math.random() * 1000)};
      NormalCollection.insert(data);
      var cursor = NormalCollection.find({}, {sort: {created_on: 1}});
      if (cursor.count() > 1500) {
        _.each(cursor.fetch(), function(element, idx) {
          if (idx <= (cursor.count() - 1500)) {
            NormalCollection.remove({_id: element._id});
          }
        });
      }
    }
  });

  SyncedCron.start();
});

