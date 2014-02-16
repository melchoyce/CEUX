
    // AUDIO CONTENT BLOCK
    post.audioView = post.BlockView.extend({
      tpl: '#wp-audio',
      init: function(){
        console.log( this.model );
      }
    });