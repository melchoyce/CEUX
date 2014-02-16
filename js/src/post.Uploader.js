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
