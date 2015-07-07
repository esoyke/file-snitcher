  var log = console.log.bind(console);

/**
 * files Template lifecycle methods
 */
Template.files.onCreated(function() {
  this.subscribe('files');
  this.subscribe('watchLocation/all');
});

// used to determine when watching started, only mark activities after this as 'new'
var startupTime = new Date();

/**
 * files Template helpers/events
 */
Template.files.helpers({
  /* Returns files sorted by deleted time, then created */
  files: function() {
    //TODO would be a nice enhancement to make the sort order selectable from client input
    return Files.find({}, {sort: {deleted: -1, created_on: -1}});
  },
  isDir: function(type) {
    if(type==='DIR') return true;
  },
  /* returns background color for row based on file properties */
  getStatusColor: function(deleted, changed, created_on) {
    var tmpCreated = new Date(created_on);
    var tmpChanged = new Date(changed);
    var tmpDeleted = new Date(deleted);
    // indicate file was re-created after deletion- can get rid of the recreated variable
    log('deleted: '+deleted+', changed: '+changed+', created_on: '+created_on);
    // if(deleted && changed && changed>deleted) return 'lightblue';
    if(tmpDeleted && tmpChanged.getTime()>tmpDeleted.getTime()) return 'lightblue';
    if(deleted) return 'red';
    if(changed) return 'yellow';
    // was running into weirdness unless I compared the time rather than date
    var tmp = new Date(created_on);
    if(startupTime.getTime() < tmp.getTime()) return 'green';
    return 'white';
  },
  /* Returns user list to display ONLY if the date of the action occurred since the app loaded */
  displayUsers: function(userList, deleted, changed, created_on){
    var tmpCreated = new Date(created_on);
    var tmpChanged = new Date(changed);
    var tmpDeleted = new Date(deleted);
    // same as in the getStatusColor helper- weirdness unless I compared the times
    if((deleted && (startupTime.getTime()<tmpDeleted.getTime())) || (changed && (startupTime.getTime()<tmpChanged.getTime())) ||
        startupTime.getTime()<tmpCreated.getTime()) {
      return userList;      
    }
  },
  // TODO- this isn't working yet
  watchLoc: function() { 
        var watchLocation = WatchLocation.findOne({_id:'123'});  //'userId':Meteor.userId()}); 
        if (!watchLocation) { 
                // Create one if there isn't already one 
                watchLocation = {val:'/tmp4'}; 
                WatchLocation.insert(watchLocation); 
        } 
        else {
        	console.log('found val='+watchLocation.val);
        }
        return watchLocation; 
  } 

});

WatchLocation = new Meteor.Collection('watchLocation'); 

Template.files.events({
  "keydown #folderLoc": function (event) {
     var value = $(event.target).val();
     console.log(value);
     //Session.set("folderLocation", value);
     var watchLocation = WatchLocation.findOne({_id:'123'});//  //'userId':Meteor.userId()}); 
    // if (!watchLocation) { 
    // 	console.log('no location found, inserting...');
    //         // Create one if there isn't already one 
    //         watchLocation = {_id:'1', val:'/tmp6'}; 
    //         WatchLocation.insert(watchLocation); 
    // } 
	WatchLocation.update('123', {$set: {val: value}});
  }
});