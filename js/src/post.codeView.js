
    // CODE CONTENT BLOCK
    post.codeView = post.BlockView.extend({
      tpl: '#wp-code',
      isEditable: true,
      init: function(){
        console.log( this.model );
      }
    });
