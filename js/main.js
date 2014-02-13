(function ( $ ) {
  "use strict";

  $(function () {
  
    // the post namespace
    var post = post || {};

    // the post model - contains all the data of the post
    post.Data = Backbone.Model.extend({
      defaults: {
        title: 'Your title here',
        permalink: '',
        content: {},
        meta: {},
      }
    });

    // get button template via ajax
    $.get( ajaxurl, { action: 'get_cb_button_tpl' } ).done( function( tpl ){
      post.blocksBtn_tpl = tpl;

      // create an instance of the Blocks Container View and fill it with the collection
      post.blockMenu = new post.BlocksContainerView({ collection: post.blocksCol });

    });

    // a custom object for Plupload plugin
    post.Uploader = Backbone.Model.extend({  
      initialize: function(){

        // build the object with the proper ids
        this.objects = {
          browse_button: this.get( 'browse_button' ),
          container: this.get( 'container'),
          drop_element: this.get( 'drop_element' ),
        };

        this.$settings = _.extend( {}, this.get( 'defaults' ), this.objects );
        this.response = {};

        // sets dinamically the uploader ids and merge with the current options
        // get a new instance of Plupload
        this.instance = new plupload.Uploader( this.$settings );

        this.init();

      },
      init: function(){

        // cache for use inside setTimeout
        var self = this,
            $uploader = self.instance;

        // this trick is needed, because if you call Plupload right on creation, the required objects 
        // (browse_button, container, drop_element) are not yet at the DOM.
        // So, delay just a little to make it work.
        setTimeout( function() {
          $uploader.init();
 
          $uploader.bind( 'FilesAdded', _.bind( self.filesAdded, this ) );
          $uploader.bind( 'QueueChanged', _.bind( self.queueChanged, this ) );

          // prevent default behavior of "browse_button"
          $uploader.trigger("DisableBrowse", true);

        }, 10 );
      },
      logIt: function(){
        console.log( this.instance );
      },
      filesAdded: function( up, files ){
        console.log( 'FilesAdded' );
        up.start();
      },
      queueChanged: function( up, files ){
        console.log( 'QueueChanged' );
        up.start();
        up.refresh();
      },
      getAttatchment: function(){
        console.log( this.response );
        console.log( this.get('response') );
        console.log( self.response );
        console.log( self.get('response') );
      }
    })

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


    // CONTENT BLOCKS ==============================================================================================//
    // Block default model
    post.Block = Backbone.Model.extend({
      defaults: {
        wp_id: 0,
        remove: true,
        move: true,
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
      },

      init: function(){ 
        // empty function that will be replaced for each content block
      },

      onRender: function(){ 
        // empty function that will be replaced for each content block
      },
      initialize: function(){
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

        this.onRender();
        this.trigger( 'onRender' );
      },
      render: function(){

        this.$el.html(this.template(
          {
            wp_id: this.model.get('wp_id'),
            block_type: this.model.get('type'),
            block_content: this.model.get('body'),
            remove: this.model.get('remove'),
            move: this.model.get('move'),
            editable: this.isEditable
          }
        ));

        return this;
      },
      unrender: function(){
        this.$el.remove();
      },
      destroy: function(){
        this.model.destroy();
      },
      moveUp: function(e){
        var current = $(e.currentTarget).parents('.content-block');
        var prev = current.prev('.content-block');
        prev.insertAfter(current);
      },
      moveDown: function(e){
        var current = $(e.currentTarget).parents('.content-block');
        var prev = current.next('.content-block');
        prev.insertBefore(current);
      },
    });    



    // the blocks custom views ========================================================================================//

    // TEXT CONTENT BLOCK
    post.textView = post.BlockView.extend({
      tpl: '#wp-text',
      isEditable: true
    });

    // QUOTE CONTENT BLOCK
    post.quoteView = post.BlockView.extend({
      tpl: '#wp-quote',
    });

    // CODE CONTENT BLOCK
    post.codeView = post.BlockView.extend({
      tpl: '#wp-code',
      isEditable: true,
      init: function(){
        console.log( this.model );
      }
    });

    // EMBED CONTENT BLOCK
    post.embedView = post.BlockView.extend({
      tpl: '#wp-embed',
    });

    // TWEET CONTENT BLOCK
    post.tweetView = post.BlockView.extend({
      tpl: '#wp-tweet',
    });

    // IMAGE CONTENT BLOCK
    post.imgView = post.BlockView.extend({
      tpl: '#wp-image',
      events: {
        'click .open-modal' : 'mediaModal',
        'click .remove-img' : 'removeImg',
        'click .opt-size' : 'imgSize',
        'click .opt-align' : 'imgAlign',
        'dragover .drag-drop' : 'dragOver',
        'dragleave .drag-drop' : 'dragLeave',
        'drop .drag-drop' : 'dropUpload'
      },
      init: function(){
        // object to get the image sizes
        this.imgSizes = {};
        this.blockType = this.model.get( 'type' );
      },
      onRender: function(){

        console.log( 'Plupload' );

        var $id = this.model.get( 'wp_id' );
 
        // set a Plupload instance for this view
        this.upl = new post.Uploader({
          browse_button: 'wp-browse-button-' + $id, 
          container: 'wp-img-ui-' + $id, 
          drop_element: 'wp-drag-drop-' + $id,
          defaults: ceux_plupload 
        });

        this.upl.instance.bind( 'FilesAdded', _.bind( this.filesAdded, this ) );
        this.upl.instance.bind( 'FileUploaded', _.bind( this.fileUploaded, this ) );
        this.upl.instance.bind( 'UploadProgress', _.bind( this.uploaderProgress, this ) );
        
      },
      mediaModal: function(e){
        e.preventDefault();

        var self = this;

        //If the frame already exists, reopen it
        if ( typeof( file_modal ) !== "undefined" ) {
           file_modal.close();
        }
   
        //Create WP media frame.
        var file_modal = wp.media.frames.customHeader = wp.media({
           //Title of media manager frame
           title: "Select An Image",
           library: {
              type: 'image'
           },
           button: {
              //Button text
              text: "insert image"
           },
           //Do not allow multiple files, if you want multiple, set true
           multiple: false,
        });

        // checks if this block type is image
        if( this.blockType == 'wp-image' ){      

          //callback for selected image
          file_modal.on( 'select', function() {
            var attachment = file_modal.state().get( 'selection' ).first().toJSON();
            
            // console.log(attachment.getURL('thumbnail'));
             //do something with attachment variable, for example attachment.filename
             //Object:
             //attachment.alt - image alt
             //attachment.author - author id
             //attachment.caption
             //attachment.dateFormatted - date of image uploaded
             //attachment.description
             //attachment.editLink - edit link of media
             //attachment.filename
             //attachment.height
             //attachment.icon - don't know WTF?))
             //attachment.id - id of attachment
             //attachment.link - public link of attachment, for example ""http://site.com/?attachment_id=115""
             //attachment.menuOrder
             //attachment.mime - mime type, for example image/jpeg"
             //attachment.name - name of attachment file, for example "my-image"
             //attachment.status - usual is "inherit"
             //attachment.subtype - "jpeg" if is "jpg"
             //attachment.title
             //attachment.type - "image"
             //attachment.uploadedTo
             //attachment.url - http url of image, for example "http://site.com/wp-content/uploads/2012/12/my-image.jpg"
             //attachment.width

            // insert image
            self.setImg( attachment );            
          });
        }
        //Open modal
        file_modal.open();
      },
      filesAdded: function(){

        this.$bar = $('<div class="upload-bg"><div class="upload-bar"><div class="upload-percent"></div><div><p class="upload-label"></p></div>');
        this.$el.find( $( '.' + this.blockType ) ).append( this.$bar );

      },
      uploaderProgress: function( up, file ){
        // set progress bar width
        this.$bar.find('.upload-percent').css('width', up.total.percent +'%' );
        this.$bar.find('.upload-label').html( 'Uploading ' + file.name );

      },
      fileUploaded: function( up, file, response ){
        console.log( 'FileUploaded' );
        this.Img = $.parseJSON( response.response ); 

        this.setImg( this.Img );

      },
      setImg: function( attachment ){

          var self = this,
              imgID = 'wp-image-' + attachment.id,
              $placeholder = this.$el.find( $( '.' + this.blockType ) ),
              $imgTemplate = _.template( $('#image-placeholder' ).html() );

          $placeholder.html( $imgTemplate({
            id: imgID,
            url: self.getImgURL( attachment, 'full' )
          }) );

      },
      getImgURL: function(obj, el){

        var self = this;
        
        // loop through the sizes of the thumb
        for ( var property in obj.sizes ) {
            if ( obj.sizes.hasOwnProperty( property ) ) {
                self.imgSizes[property] = obj.sizes[property].url; 
            }
        }
        
        return self.imgSizes[el];
      },
      imgSize: function(e){
        var button = $( e.currentTarget );
        var image = this.$el.find( '.img-file' );

        if( !button.hasClass( 'selected' ) ){

          this.$el.find( '.opt-size' ).removeClass( 'selected' );
          button.addClass( 'selected' );

          if( button.hasClass( 'size-thumbnail' ) ){ 
            image.attr( 'src', this.imgSizes.thumbnail );
          } else if( button.hasClass( 'size-medium' ) ){          
            image.attr( 'src', this.imgSizes.medium );
          } else if( button.hasClass( 'size-full' ) ){
            image.attr( 'src', this.imgSizes.full );
          }

        }
      },
      imgAlign: function(e){
        var button = $(e.currentTarget);
        var image = this.$el.find('.img-file');

        if(!button.hasClass('selected')){

          this.$el.find('.opt-align').removeClass('selected');
          button.addClass('selected');

          if(button.hasClass('align-left')){ 
            image.attr('class', 'img-file alignleft');
          } else if(button.hasClass('align-center')){          
            image.attr('class', 'img-file aligncenter');
          } else if(button.hasClass('align-right')){
            image.attr('class', 'img-file alignright');
          } else{
            image.attr('class', 'img-file alignone');
          }

        }
      },
      removeImg: function(e){
        e.preventDefault();
        this.render();

        // rebuild the Plupload instance
        this.onRender();
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
    
    // the post view =======================================================================//

    post.View = Backbone.View.extend({
      el: '#content-blocks',

      events: {
        'click #add-block' : 'blockMenu',
        'change #post-title': 'updateTitle',
        'click #publish': 'savePost',
      },

      initialize: function(){
        // _.bindAll(this, 'render', 'addBlock', 'blockMenu','updateTitle');
        this.container = $('#content');
        this.addBtn = $('#blocksSelect');
        
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

    // CONFIG ================================================================================================//

    // TinyMCE config
    tinymce.init({
      // skin_url: tinymce_vars.CEUXskin,
      selector: ".editable",
      add_unload_trigger: false,
      schema: "html5",
      inline: true,
      fixed_toolbar_container: "#wp-editor-toolbar",
      menubar: false,
      toolbar: "undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image",
      statusbar: false
    });

    $('#add-block').on('click', function(e){
        e.preventDefault();

        $('#blocksSelect').toggleClass( 'active' );
    });


    // sticky toolbar at the top
    $(window).scroll(function(){ // scroll event  

      if ( collision( $('#postdivrich'), $('#wpadminbar') ) ) {
        $('#wp-editor-toolbar').css({ position: 'fixed', top: 32, zIndex: 9999, width: $('#postdivrich').width() });
      }
      else {
        $('#wp-editor-toolbar').css({ position: 'static' });
      }
   
    });

    // collision function ( http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery )
    function collision($div1, $div2) {
      var x1 = $div1.offset().left;
      var y1 = $div1.offset().top;
      var h1 = $div1.outerHeight(true);
      var w1 = $div1.outerWidth(true);
      var b1 = y1 + h1;
      var r1 = x1 + w1;
      var x2 = $div2.offset().left;
      var y2 = $div2.offset().top;
      var h2 = $div2.outerHeight(true);
      var w2 = $div2.outerWidth(true);
      var b2 = y2 + h2;
      var r2 = x2 + w2;

      if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) return false;
      return true;
    }

  });

}(jQuery));