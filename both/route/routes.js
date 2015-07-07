FlowRouter.route('/', {
  name: 'home',
  action: function(params) {
    FlowLayout.render('home');
  }
});

FlowRouter.route('/files', {
  name: 'files',
  action: function(params) {
    FlowLayout.render('files');
  }
});
