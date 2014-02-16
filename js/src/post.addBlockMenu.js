
    // CONTENT BLOCKS CONTAINER ====================================================================================//

    // The Block selector default model
    post.BlockModel = Backbone.Model.extend();

    // The Blocks Container Collection
    post.BlocksContainer = Backbone.Collection.extend({
      url: ajaxurl,
      model: post.BlockModel,
      // checks if this custom block is default
      group: function(block){
        return _(this.filter(function(data) {
            return data.get("group") == block;
        }));
      },
      // search blocks by name
      search: function(letters){
        if(letters == "") return this;
     
        var pattern = new RegExp(letters,"gi");
        return _(this.filter(function(data) {
            return pattern.test(data.get("name"));
        }));

        // return new post.BlocksContainer(blocks);
      }
    });

    // create an instance of the blocks collection
    post.blocksCol = new post.BlocksContainer();

     // the blocks Selector view
    post.BlockButton = Backbone.View.extend({
      initialize: function(){
        this.listenTo( this.model, 'destroy', this.unrender );
        this.template = _.template( post.blocksBtn_tpl );
        this.render();
      },
      render: function(){

        this.$el.html( this.template({
          name: this.model.get( 'name' ),
          slug: this.model.get( 'slug' ),
          icon: this.model.get( 'icon' ),
          view: this.model.get( 'view' ),
        }) );      

        return this;

      }
    });

    // the Blocks Container view
    post.BlocksContainerView = Backbone.View.extend({
      el: '#blocksSelect',
      events: {
        'keyup #blocks-search' : 'search',
        'click .customBlock' : 'addBlock',
      },
      initialize: function(){
        _.bindAll( this, 'render' );
        this.listenTo( this.collection, 'reset', this.render );
        this.defaults = $( '#defaults-container' );
        this.others = $( '#others-container' );
        this.results = $( '#results-container' );

        var params = {
          action: 'get_content_blocks',
        }

        var self = this;

        this.collection.fetch({

          data: $.param(params),
            success: ( function () {

              // check the which block is a default and add it in an especial area
              self.defaultBlocks = self.collection.group( 'default' );
              self.otherBlocks = self.collection.group( 'other' );

              self.render();
            }),
            error:( function (e ,r) {
                console.log(' Service request failure: ' + e);
                console.log( r.responseText );
            })
          });

      },
      render: function(){

        var self = this;

        self.defaults.html('').append( '<h3>Default Blocks</h3>' );
        self.others.html('').append( '<h3>Other Blocks</h3>' );

        self.defaultBlocks.each( function( dft ){
          var defaultView = new post.BlockButton({ model: dft });
          self.defaults.append( defaultView.render().el );
        } );

        self.otherBlocks.each( function( blk ){
          var otherView = new post.BlockButton({ model: blk });
          self.others.append( otherView.render().el );
        } );

      },
      renderList : function( blocks ){
        this.defaults.html('');
        this.others.html('');
        
        this.results.html('');
        var self = this;

        blocks.each( function(blk){
          var buttonView = new post.BlockButton({
            model: blk,
            collection: self.collection
          });
          self.results.append( buttonView.render().el );
        } );

      },
      search: function(e){
        var letters = $(e.target).val();
        if(!letters){
          this.results.html('');
          this.render();
        }else {
          this.renderList( this.collection.search( letters ) );
        }
      },
      addBlock: function(e){

        var $model = this.collection.findWhere({ slug: $( e.currentTarget ).attr( 'data-type' ) }),
            $type = $model.get( 'slug' ),
            $view = $model.get( 'view' );

        post.view.addBlock( $type, $view );

      }
    });


