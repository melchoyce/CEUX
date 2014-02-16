    
    // the post view =======================================================================//

    post.View = Backbone.View.extend({
      el: '#content-blocks',

      events: {
        'click #add-block' : 'blockMenu',
        'change #post-title': 'updateTitle',
        'click #publish': 'savePost',
      },

      initialize: function(){
        this.container = $('#content');
        this.addBtn = $('#blocksSelect');

        // get the post placeholder and make a copy of it
        this.$postPlaceholder = $( '#post-placeholder' );
        this.$postPlaceholderCopy = this.$postPlaceholder.clone();

        // check if the collection is empty
        this.listenTo( this.collection, 'reset sync add remove', this.removePlaceholder );

        // counter for the views
        this.counter = 0;

        this.render();

        // initial state of sortable plugin
        this.$el.sortable({
          handle: '.move',
          // containment: '#container',
          connectWith: ".content-blocks",
          placeholder: "blocks-placeholder",
          start: function(e, ui){
            ui.placeholder.height(ui.item.outerHeight());

            // hide TinyMCE on drag
            $('.mce-tinymce').hide();
          }
        });

      },
      render: function(){
        // initialize the post model
        // post.thePost = new post.Data();

        // // insert first content block
        // this.counter++;
        // var initBlock = new post.Block();
        // initBlock.set({
        //   wp_id: 'block_' + this.counter,
        //   remove: false
        // });
        
        // // add to collection
        // this.collection.add( initBlock );

        // // bind initial model to a new instance of BlockView
        // var initView = new post.BlockView({ model:initBlock });
        // this.$el.append( initView.render().el );
      },
      removePlaceholder: function(){
        if( this.collection.length > 0 ){
          this.$postPlaceholder.remove();
        } else {
          this.$el.append( this.$postPlaceholderCopy );
          this.$postPlaceholder = $( '#post-placeholder' );
        }
      },
      blockMenu: function(e){
        // prevent default behavior
        e.preventDefault();

        this.addBtn.toggleClass( 'active' );

      },
      addBlock: function( type, view ){

        var objType = 'wp-' + type;

        // creates a new instance of Block model
        this.counter++;

        var block = new post.Block({
          wp_id: 'block_' + this.counter,
          type: objType
        });

        // get view object
        var theView = post[ view ];
        
        // add to collection
        this.collection.add( block );
        this.addBtn.removeClass( 'active' );

        // creates a new instance of BlockView and binds the new model to it
        var newBlock = new theView({ model:block });
        this.$el.append( newBlock.render().el );

        if( newBlock.isEditable ){
          // initialize TinyMCE to this content block, if it has the 'isEditable' parameter
          this.setEditable( $( '#' + block.get( 'wp_id' ) ) );
        }
      },
      setEditable: function( block ){
          var editable = block.find( '.editable' ).attr( 'id' );
          tinymce.execCommand( 'mceAddEditor', false, editable );
      },
      savePost: function(){

        console.log( post.blocks.toJSON() );

        alert('Here we need to get all the data from post.Blocks collection, serialize it and save on the database. The post.Data model will hold the content when the post is loaded, then it should pass it to the post.Blocks collection to rebuild the content blocks.');
      },

    });

    // initiate the content blocks view
    post.view = new post.View({ collection: post.blocks });
