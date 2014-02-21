
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