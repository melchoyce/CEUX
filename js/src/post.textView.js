    // the blocks custom views ========================================================================================//

    // TEXT CONTENT BLOCK
    post.textView = post.BlockView.extend({
      tpl: '#wp-text',
      isEditable: true,
      afterRender: function(){
      	var self = this;
      	setTimeout( function(){

      		var $editor = $( '#text-' + self.model.get( 'wp_id' ) );
      		self.placeholder = $editor.attr( 'placeholder' );
      		$editor.contents().text( self.placeholder );
      	}, 10);
      }
    });
