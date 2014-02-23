
    // AUDIO CONTENT BLOCK
    post.audioView = post.BlockView.extend({
      tpl: '#wp-audio',
      events: {
      	'click .oembed-fetch' : 'fetchAudio',
        'click .audio-remove' : 'render',
        'click .audio-preview' : 'setAudio',
        'dragover .drag-drop' : 'dragOver',
        'dragleave .drag-drop' : 'dragLeave',
        'drop .drag-drop' : 'dropUpload'
      },
      init: function(){
        this.$placeholderTpl = _.template( $( '#audio-placeholder-tpl' ).html() );
      },
      fetchAudio: function( e ){
      	e.preventDefault();

      	var self = this,
      		$url = this.$el.find('.oembed-url'),
      		$val = $url.val(),
      		data = {
      			action: 'fetch_cb_oembed',
            media: 'audio',
      			url: $val
      		};

  		this.model.set({ url: $val });

  		$.get( ajaxurl, data ).done( function( response ){
        self.currentAudio = response;
        self.setPlaceholder( response.thumb );
      } );

      },
      setPlaceholder: function( url ){
        this.$el.find('.wp-block').html( this.$placeholderTpl({ url: url }) );
      },
      setAudio: function( e ){
        e.preventDefault();
        this.$el.find('.audio-placeholder').html( this.currentAudio.html );
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