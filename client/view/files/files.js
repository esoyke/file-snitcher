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
  getStatusColor: function(deleted, changed, recreated) {
    if(deleted) return 'red';
    if(changed) return 'yellow';
    if(recreated) return 'blue';
    return 'white';
  },
  watchLoc: function() { 
        // Assume there is only one campaign document - if there are more, then the find will have to select the correct one 
        // The document within the campaigns collection should have a property named 'count' 
        var watchLocation = WatchLocation.findOne({_id:'123'});//  //'userId':Meteor.userId()}); 
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
    // Increment the count property 
//    WatchLocation.update({},{$inc:{count:1}}); 
    // WatchLocation.update({_id:1},val:'/tmp5'); 
	WatchLocation.update('123', {$set: {val: value}});
  }
});