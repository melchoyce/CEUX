
    // AUDIO CONTENT BLOCK
    post.audioView = post.BlockView.extend({
      tpl: '#wp-audio',
      events: {
      	'click .oembed-fetch' : 'fetchAudio',
      },
      init: function(){
      },
      fetchAudio: function( e ){
      	e.preventDefault();

      	var self = this,
      		$url = this.$el.find('.oembed-url'),
      		$val = $url.val(),
      		data = {
      			action: 'fetch_cb_audio',
      			url: $val
      		};

      		$.get( ajaxurl, data ).done( function( html ){
      			self.setAudio( html );
      		} );
      },
      setAudio: function( html ){
      	this.$el.find('.wp-block').html( html );
      }
    });