
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

          $placeholder.html( $imgTemplate({
            id: imgID,
            url: self.getImgURL( attachment, 'full' ),
            caption: attachment.caption
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

