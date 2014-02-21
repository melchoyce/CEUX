    // CONTENT BLOCKS ==============================================================================================//
    // Block default model
    post.Block = Backbone.Model.extend({
      defaults: {
        wp_id: 0,
      }
    });

    // collection of content blocks
    post.Blocks = Backbone.Collection.extend({
      model: post.Block
    })

    post.blocks = new post.Blocks();

    // the blocks parent view =================================================================================//

    post.BlockView = Backbone.View.extend({
      tagName: 'div',
      className: 'content-block',
      tpl: '#wp-text',  // custom tpl selector for template
      isEditable: false, // set if this content block template uses tinyMCE or not
      events: {
        'click .remove' : 'destroy',
        'click .move-up' : 'moveUp',
        'click .move-down' : 'moveDown',
        'drop' : 'dropView',
      },

      init: function(){ 
        // empty function that will be replaced for each content block
      },

      beforeRender: function(){ 
        // empty function that will be replaced for each content block
      },
      afterRender: function(){ 
        // empty function that will be replaced for each content block
      },
      initialize: function(){
        this.beforeRender();
        this.trigger( 'beforeRender' );

        this.listenTo( this.model, 'destroy', this.unrender );
        this.template = _.template( $( this.tpl ).html() );

        // add events from child
        if ( this.events ){
          this.events = _.defaults( this.events, post.BlockView.prototype.events );
        }

        this.delegateEvents( this.events );

        // custom initialize functions after template rendering
        this.init();

        this.render();

        this.afterRender();
        this.trigger( 'afterRender' );
      },
      render: function(){

        this.$el.html( this.template(
          {
            wp_id: this.model.get( 'wp_id' ),
            block_type: this.model.get( 'type' ),
            block_content: this.model.get( 'body' ),
            editable: this.isEditable
          }
        ) );

        return this;
      },
      unrender: function(){
        this.$el.remove();
      },
      destroy: function(){
        this.model.destroy();
      },
      moveUp: function( e ){
        var current = $( e.currentTarget ).parents( '.content-block' );
        var prev = current.prev( '.content-block' );
        prev.insertAfter( current );
      },
      moveDown: function( e ){
        var current = $( e.currentTarget ).parents( '.content-block' );
        var prev = current.next( '.content-block' );
        prev.insertBefore( current );
      },
      dropView: function( event, index ){
        this.$el.trigger( 'update-sort', [this.model, index] );
      }
    });    


