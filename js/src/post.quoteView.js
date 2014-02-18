
	// QUOTE CONTENT BLOCK
	post.quoteView = post.BlockView.extend({
	  tpl: '#wp-quote',
	  events: {
		'keyup textarea' : 'resizeTextarea',
	  },
	  afterRender: function(){
		// this.resizeTextarea();
	  },
	  resizeTextarea: function( $el ){

	  	if( !this.$textarea ){
			this.$textarea = $( '#quote_' + this.model.get( 'wp_id' ) );
	  	}

		this.$textarea.css({ 'height' : 'auto' });
		this.$textarea.css({ 'height': this.$textarea.prop( 'scrollHeight' ) +'px' });
	  }
	});
