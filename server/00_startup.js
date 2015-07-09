
/**
 * Startup method to generate data in our collections
 */
Meteor.startup(function() {

  var log = console.log.bind(console);

  Meteor.methods({
          getWatchFolder: function () {
              return '/tmp2';
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
            // ignore the watch folder itself (needed if using fs.readdirSync)
            // if(path===Meteor.call('getWatchFolder') ) return true;
            // fs.readdirSync doesn't include dir name so you must strip it from search target
            // return _.contains(startingFiles, path.substring(Meteor.call('getWatchFolder').length+1, path.length));
            // console.log('checking if this existed at startup: '+ path);
            return _.contains(startingFiles, path);
          },          
  });

   
  var startingFiles = Meteor.call('getFileListing');

  //temp EBS
//  Session.set("folderLoc", "/tmp3");
  // var initLoc = {_id:'2', val: '/tmp2'};
  // WatchLocCollection.insert(initLoc);

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
