
    // EMBED CONTENT BLOCK
    post.embedView = post.BlockView.extend({
    	tpl: '#wp-embed',
    	events:{
    		'blur .embed-text' : 'showPlaceholder',
    		'click .edit' : 'showTextarea',
    	},
    	showPlaceholder: function( e ){
    		if( !this.$embed ){
    			this.$embed = $( e.currentTarget );
    		}
    		if( !this.$placeholder ){
    			this.$placeholder = this.$embed.next( '.embed-placeholder' );
    		}

    		this.$embed.hide();
    		this.$placeholder.show();
    	},
    	showTextarea: function(){
    		this.$placeholder.hide();
    		this.$embed.show().focus();
    	}
    });
