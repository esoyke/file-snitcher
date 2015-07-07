/**
 * files Template lifecycle methods
 */
Template.files.onCreated(function() {
  this.subscribe('files');
  this.subscribe('watchLocation/all');
});

/**
 * files Template helpers/events
 */
Template.files.helpers({
  files: function() {
    return Files.find({}, {sort: {created_on: -1}});
  },
  isDir: function(type) {
    if(type==='DIR') return true;
  },
  /* returns background color for row based on file properties */
  getStatusColor: function(deleted, changed, recreated) {
    if(deleted) return 'red';
    if(changed) return 'yellow';
    // TODO- I had tried indicating a file had been created that had been previously deleted 
    // and indicate as blue, but haven't gotten that working yet
    if(recreated) return 'blue';
    return 'white';
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