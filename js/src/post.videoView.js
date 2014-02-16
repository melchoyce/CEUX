
    // VIDEO CONTENT BLOCK
    post.videoView = post.BlockView.extend({
      tpl: '#wp-video',
      init: function(){
        console.log( this.model );
      }
    });
