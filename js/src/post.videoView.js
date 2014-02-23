
    // VIDEO CONTENT BLOCK
    post.videoView = post.BlockView.extend({
      tpl: '#wp-video',
      events: {
      	'click .oembed-fetch' : 'fetchVideo',
        'click .video-remove' : 'render',
        'click .video-preview' : 'setVideo',
        'dragover .drag-drop' : 'dragOver',
        'dragleave .drag-drop' : 'dragLeave',
        'drop .drag-drop' : 'dropUpload'
      },
      init: function(){
        this.$placeholderTpl = _.template( $( '#video-placeholder-tpl' ).html() );
      },
      fetchVideo: function( e ){
      	e.preventDefault();

      	var self = this,
      		$url = this.$el.find('.oembed-url'),
      		$val = $url.val(),
      		data = {
      			action: 'fetch_cb_oembed',
            media: 'video',
      			url: $val
      		};

    		this.model.set({ url: $val });

    		$.get( ajaxurl, data ).done( function( response ){
          self.currentVideo = response;
    			self.setPlaceholder( response.thumb );
    		} );

      },
      setPlaceholder: function( url ){
        this.$el.find('.wp-block').html( this.$placeholderTpl({ url: url }) );
      },
      setVideo: function( e ){
        e.preventDefault();
      	this.$el.find('.video-placeholder').html( this.currentVideo.html );
      },
      dragOver: function(e){
        e.stopPropagation();
        e.preventDefault();
      
        this.$el.find('.drag-drop-area').addClass('drag-over');
      },
      dragLeave: function(e){
        this.$el.find('.drag-drop-area').removeClass('drag-over');
      },
      dropUpload: function(e){
        this.$el.find('.drag-drop-area').removeClass('drag-over');
      }
    });
