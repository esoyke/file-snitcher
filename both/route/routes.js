FlowRouter.route('/', {
  name: 'files',
  action: function(params) {
    FlowLayout.render('files');
  }
});

FlowRouter.route('/files', {
  name: 'files',
  action: function(params) {
    FlowLayout.render('files');
  }
});
