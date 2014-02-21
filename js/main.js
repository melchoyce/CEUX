(function ( $ ) {
"use strict";

	$(function () {

    // the post namespace
    var post = post || {};

    // the post model - contains all the data of the post
    post.Data = Backbone.Model.extend();

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
        this.params = {
          browse_button: this.get( 'browse_button' ),
          container: this.get( 'container'),
          drop_element: this.get( 'drop_element' ),
          multi_selectioni: this.get( 'multi_selectioni' ),
        };

        this.$settings = _.extend( {}, this.get( 'defaults' ), this.params );
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
        // console.log( 'FilesAdded' );
        up.start();
      },
      queueChanged: function( up, files ){
        // console.log( 'QueueChanged' );
        up.start();
        up.refresh();
      },
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


    // CODE CONTENT BLOCK
    post.codeView = post.BlockView.extend({
      tpl: '#wp-code',
      isEditable: true,
      init: function(){
        console.log( this.model );
      }
    });


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

  		this.model.set({ url: $val });

  		$.get( ajaxurl, data ).done( function( html ){
  			self.setAudio( html );
  		} );
      },
      setAudio: function( html ){
      	this.$el.find('.wp-block').html( html );
      }
    });

    // VIDEO CONTENT BLOCK
    post.videoView = post.BlockView.extend({
      tpl: '#wp-video',
      events: {
      	'click .oembed-fetch' : 'fetchVideo',
      },
      init: function(){
        console.log( this.model );
      },
      fetchVideo: function( e ){
      	e.preventDefault();

      	var self = this,
      		$url = this.$el.find('.oembed-url'),
      		$val = $url.val(),
      		data = {
      			action: 'fetch_cb_video',
      			url: $val
      		};

  		this.model.set({ url: $val });

  		$.get( ajaxurl, data ).done( function( html ){
  			self.setVideo( html );
  		} );
      },
      setVideo: function( html ){
      	this.$el.find('.wp-block').html( html );
      }
    });


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
      afterRender: function(){

        // console.log( 'Plupload' );

        var $id = this.model.get( 'wp_id' );
 
        // set a Plupload instance for this view
        this.upl = new post.Uploader({
          browse_button: 'wp-browse-button-' + $id, 
          container: 'wp-img-ui-' + $id, 
          drop_element: 'wp-drag-drop-' + $id,
          multi_selection: false,
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
        // console.log( 'FileUploaded' );
        this.Img = $.parseJSON( response.response ); 

        this.setImg( this.Img );

      },
      setImg: function( attachment ){

          var self = this,
              imgID = 'wp-image-' + attachment.id,
              $placeholder = this.$el.find( $( '.' + this.blockType ) ),
              $imgTemplate = _.template( $('#image-placeholder' ).html() );

          var content = {
            imgID: imgID,
            url: self.getImgURL( attachment, 'full' ),
            caption: attachment.caption
          };        

          $placeholder.html( $imgTemplate( content ) );

          // set model content
          this.model.set( content );

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
            this.currentSize = this.imgSizes.thumbnail;
          } else if( button.hasClass( 'size-medium' ) ){          
            this.currentSize = this.imgSizes.medium;
          } else if( button.hasClass( 'size-full' ) ){
            this.currentSize = this.imgSizes.full;
          }

          image.attr( 'src', this.currentSize );

          // set current image size
          this.model.set({ url: this.currentSize });

        }
      },
      imgAlign: function( e ){
        var button = $( e.currentTarget );
        var image = this.$el.find( '.img-file' );

        if( !button.hasClass( 'selected' ) ){

          this.$el.find( '.opt-align' ).removeClass( 'selected' );
          button.addClass( 'selected' );

          if( button.hasClass( 'align-left' ) ){ 
            this.currentAlign = 'alignleft';
          } else if( button.hasClass( 'align-center' ) ){          
            this.currentAlign = 'aligncenter';
          } else if( button.hasClass( 'align-right' ) ){
            this.currentAlign = 'alignright';
          } else{
            this.currentAlign = 'alignone';
          } 
          image.attr( 'class', 'img-file ' + this.currentAlign );

          // set current image align class
          this.model.set({ align: this.currentAlign });

        }
      },
      removeImg: function(e){
        e.preventDefault();
        this.render();

        // rebuild the Plupload instance
        this.afterRender();
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


    // GALLERY CONTENT BLOCK ===========================================================================//

    // a model for each image in a gallery
    post.GalleryModel = Backbone.Model.extend();

    // a collection for each gallery
    post.GalleryCollection = Backbone.Collection.extend();

    // the gallery image subview
    post.galleryImgTemplate = Backbone.View.extend({
      tagName: 'li',
      className: 'wp-gallery-img',
      events: {
        'click .img-remove' : 'removeImg',
      },
      initialize: function(){
        this.listenTo( this.model, 'destroy', this.unrender );
        this.template = _.template( $( '#gallery-img-tpl' ).html() );
      },
      render: function(){
        this.$el.html( this.template( this.model.toJSON() ) );

        return this;
      },
      unrender: function(){
        this.$el.remove();
      },
      removeImg: function(){
        this.model.destroy();
      },
    });

    // the gallery view
    post.galleryView = post.BlockView.extend({
      tpl: '#wp-gallery',
      events: {
        'click .open-modal' : 'mediaModal',
        'click .add-more' : 'mediaModal',
        'change .cols-num' : 'setColumns',
        'click .link-type' : 'setLinkType',
        'dragover .drag-drop' : 'dragOver',
        'dragleave .drag-drop' : 'dragLeave',
        'drop .drag-drop' : 'dropUpload',
      },
      init: function(){
        // set the gallery collection
        this.collection = new post.GalleryCollection();
        this.blockType = this.model.get( 'type' );
        this.galleryTpl = _.template( $( '#gallery-placeholder' ).html() );

        // set the number of columns in gallery
        this.model.set({ 
          columns: 6,
          link_to: 'page'
        });

        this.listenTo( this.collection, 'remove reset', this.isEmptyCol );
        this.listenTo( this.model, 'change:columns', this.renderColumns );

      },
      afterRender: function(){

        // console.log( 'Plupload' );

        var $id = this.model.get( 'wp_id' );
 
        // set a Plupload instance for this view
        this.upl = new post.Uploader({
          browse_button: 'wp-browse-button-' + $id, 
          container: 'wp-gallery-ui-' + $id, 
          drop_element: 'wp-drag-drop-' + $id,
          multi_selection: true,
          defaults: ceux_plupload 
        });

        this.upl.instance.bind( 'StateChanged', _.bind( this.stateChanged, this ) );
        this.upl.instance.bind( 'FileUploaded', _.bind( this.fileUploaded, this ) );
        this.upl.instance.bind( 'UploadProgress', _.bind( this.uploaderProgress, this ) );
        
      },
      isEmptyCol: function(){
        // if collection is empty, re-render the view
        if( this.collection.length == 0 ){
          this.render();
        }
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
           title: "Select Images",
           library: {
              type: 'image'
           },
           button: {
              //Button text
              text: "Insert into Gallery"
           },
           //Do not allow multiple files, if you want multiple, set true
           id: 'gallery-frame',
           multiple: true,
        });

        // checks if this block type is image
        if( this.blockType == 'wp-gallery' ){      

          //callback for selected image
          file_modal.on( 'select', function() {
            var attachment = file_modal.state().get( 'selection' ).toJSON();

            // check if the gallery placeholder is set
            if( self.$el.find( '.wp-gallery-list' ).length == 0 ){
              self.putPlaceholder();
            } 
            // insert image
            self.setImg( attachment );            
          });
        }
        //Open modal
        file_modal.open();
      },
      stateChanged: function( up ){
        if( up.state == plupload.STARTED ){
          this.putPlaceholder();
 
          // insert upload feedback
          this.$bar = $('<div class="upload-bg"><div class="upload-bar"><div class="upload-percent"></div><div><p class="upload-label"></p></div>');
          this.$el.find( $( '.' + this.blockType ) ).append( this.$bar );
 
          // create temporary array of images
          this.imgArray = []; 

        } else if( up.state == plupload.STOPPED ){
          this.$bar.remove();
          this.setImg( this.imgArray );
        }
      },
      uploaderProgress: function( up, file ){
        // set progress bar width
        this.$bar.find('.upload-percent').css('width', up.total.percent +'%' );
        this.$bar.find('.upload-label').html( 'Uploading ' + file.name );

      },
      fileUploaded: function( up, file, response ){
        // console.log( 'FileUploaded' );
        this.Img = $.parseJSON( response.response ); 
        // build temporary array of images
        this.imgArray.push( this.Img );
      },
      putPlaceholder: function(){
        var $placeholder = this.$el.find( $( '.' + this.blockType ) );

        $placeholder.html( this.galleryTpl({
          wp_id: this.model.get( 'wp_id' ),
          columns: this.model.get( 'columns' ),
          link_to: this.model.get( 'link_to' ),
        }) );

        // initial state of sortable plugin
        $( '#wp-gallery-sort-' + this.model.get( 'wp_id' ) ).sortable({
          containment: 'parent',
          forceHelperSize: true,
          forcePlaceholderSize: true,
          helper: 'clone',
          opacity: 0.8,
          tolerance: 'pointer',
          placeholder: "gallery-img-placeholder",
        });

      },
      setImg: function( attachment ){

        var self = this;

          _.each( attachment, function( img ){

            var imgID = 'wp-gallery-img-' + img.id,
                hasImg = self.collection.findWhere({ imgID: imgID });

            // check if image exists
            if( typeof hasImg === 'undefined' ){

              // create a new model for each gallery image
              var image = new post.GalleryModel({
                imgID: imgID,
                link: img.link,
                thumb: img.sizes.thumbnail,
              });

              // add the image to the gallery collection
              self.collection.add( image );

              // create a new subview for this image
              var imageView = new post.galleryImgTemplate({ model: image });

              // append the subview to the main gallery view
              self.$el.find( '.wp-gallery-list' ).append( imageView.render().el );

            }

          } );

      },
      setColumns: function( e ){
        var columns = $( e.currentTarget ).val();
        this.model.set({ columns: columns });
      },
      renderColumns: function(){
        // change the number of columns
        $( '#wp-gallery-sort-' + this.model.get( 'wp_id' ) ).attr( 'class', 'wp-gallery-list columns-' + this.model.get( 'columns' ) );
      },
      setLinkType: function( e ){
        e.preventDefault();
        var $button = $( e.currentTarget ),
            $buttons = this.$el.find( '.link-type' ),
            $link_to = $button.attr( 'data-type' );

        this.model.set({ link_to: $link_to });

        $buttons.removeClass( 'selected' );
        $button.addClass( 'selected' );

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
        'update-sort': 'updateSort',
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
          start: function( e, ui ){
            ui.placeholder.height( ui.item.outerHeight() );

            // hide TinyMCE on drag
            $( '.mce-tinymce' ).hide();
          },
          stop: function( event, ui ) {
            ui.item.trigger( 'drop', ui.item.index() );

            console.log( ui.item.index() );
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
          type: objType,
          
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
      updateSort: function( event, model, position ) {            
        this.collection.remove( model );

        this.collection.each( function( model, index ) {
            var ordinal = index;
            if ( index >= position ){
                ordinal += 1;
            }
            model.set( 'ordinal', ordinal );
        });            

        model.set( 'ordinal', position );

        this.collection.add( model, {at: position} );
      },
    });

    // initiate the content blocks view
    post.view = new post.View({ collection: post.blocks });


    // CONFIG ================================================================================================//

    // TinyMCE config
    tinymce.init({
      selector: ".editable",
      add_unload_trigger: false,
      schema: "html5",
      inline: true,
      fixed_toolbar_container: "#wp-editor-toolbar",
      menubar: false,
      toolbar: "undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image",
      statusbar: false,
      setup : function( ed ) {
        ed.on('blur', function(e) {
            // get the current model id and content
            var $id = e.target.id.replace('text-',''),
                $content = tinyMCE.get( e.target.id ).getContent();

            // set new model content by model id
            post.blocks.findWhere({ wp_id: $id }).set({ block_content: $content });
        });

      }
    });

    $('#add-block').on('click', function(e){
        e.preventDefault();

        $('#blocksSelect').toggleClass( 'active' );
    });

    // get post content
    $('#publish').on( 'click', function(e){
      e.preventDefault();
      console.log( post.blocks.toJSON() );
      alert( 'check your console to view the array of content blocks ordered and with atributes' );
    } );


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