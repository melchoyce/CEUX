
    // VIDEO CONTENT BLOCK
    post.videoView = post.BlockView.extend({
      tpl: '#wp-video',
      events: {
      	'click .oembed-fetch' : 'fetchVideo',
      },
      init: function(){
        console.log( this.model );
      },
      fetchVideo: function( e ){
      	e.preventDefault();

      	var self = this,
      		$url = this.$el.find('.oembed-url'),
      		$val = $url.val(),
      		data = {
      			action: 'fetch_cb_video',
      			url: $val
      		};

      		$.get( ajaxurl, data ).done( function( html ){
      			self.setVideo( html );
      		} );
      },
      setVideo: function( html ){
      	this.$el.find('.wp-block').html( html );
      }
    });
