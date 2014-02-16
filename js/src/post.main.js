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

    