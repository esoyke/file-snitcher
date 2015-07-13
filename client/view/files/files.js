var log = console.log.bind(console);

Template.files.onCreated(function() {
  this.subscribe('files');
  this.subscribe('watchLocation');
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
  getStatusColor: function(file) {
    var tmpCreated = new Date(file.created_on);
    var tmpChanged = new Date(file.changed);
    var tmpDeleted = new Date(file.deleted);
    // indicate file was re-created after deletion- can get rid of the recreated variable
    if(tmpDeleted && tmpChanged.getTime()>tmpDeleted.getTime()) return 'lightblue';
    if(file.deleted) return 'red';
    if(file.changed) return 'yellow';
    // was running into weirdness unless I compared the time rather than date
    var tmp = new Date(file.created_on);
    if(startupTime.getTime() < tmp.getTime()) return 'green';
    return 'white';
  },
  /* Returns user list to display ONLY if the date of the action occurred since the app loaded */
  displayUsers: function(file){
    var tmpCreated = new Date(file.created_on);
    var tmpChanged = new Date(file.changed);
    var tmpDeleted = new Date(file.deleted);
    // same as in the getStatusColor helper- weirdness unless I compared the times
    if((file.deleted && (startupTime.getTime()<tmpDeleted.getTime())) || (file.changed && (startupTime.getTime()<tmpChanged.getTime())) ||
        startupTime.getTime()<tmpCreated.getTime()) {
      return file.loggedInUsers;      
    }
  },
  /* Returns format:  Wed Jul 08 2015 05:30:01 pm*/
  simpleDate: function(dateIn) {
    if(!dateIn) return '';
    return moment(dateIn).format('ddd MMM DD YYYY hh:mm:ss a');
  },
  watching: function() {
    //TODO would be a nice enhancement to make the sort order selectable from client input
    log(WatchLocCollection.find({}));
    return WatchLocCollection.find({});
  }

});

/* If they change the watch location and hit Enter, propogate back to server */
Template.files.events({
    'keyup input.folderLoc': function (event, template) {     
     var value = $(event.target).val();
     console.log(value);
     if (event.which === 13){
       WatchLocCollection.insert({location:value});
       //WatchLocation.insert({location:value});

      // For some reason the change is not taking effect until a refresh is done.
      // Seems like a HACK but until I understand why, just manually refresh the browser 
      location.reload(); 
     }
  }
});