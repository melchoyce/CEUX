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
