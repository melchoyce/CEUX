<?php
/*
Plugin Name: Content Blocks
Plugin URI: http://wordpress.org/plugins/wp-content-blocks/
Description: Add "blocks" to your content
Version: 1.0.2
Author: The WordPress Team
Author URI: http://wordpress.org/
License: GNU General Public License v2 or later
*/

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

class WP_Content_Blocks {
	const FEATURE = 'content-blocks';
	const VERSION = '1.0.2';

	public $name = '';
	
	protected static $instance = null;
	protected $plugin_slug = 'wp-content-blocks';
	protected $plugin_dir = null;

	// get instance of plugin
	public static function get_instance() {

		// If the single instance hasn't been set, set it now.
		if ( null == self::$instance ) {
			self::$instance = new self;
		}

		return self::$instance;
	}

	private function __construct() {

		$this->plugin_dir = plugin_dir_url( __FILE__ );

		// initialize the plugin
		add_action( 'admin_init', array( $this, 'init') );
		add_action( 'admin_init', array( $this, 'register_content_blocks') );
		add_action( 'edit_form_after_editor', array( $this, 'content_blocks_markup') );

		// assets
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts') );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_styles') );
		add_action( 'admin_print_scripts', array( $this, 'print_scripts') );
		add_action( 'admin_print_styles', array( $this, 'print_styles') );

		// returns the content-blocks collection via ajax
		add_action( 'wp_ajax_get_content_blocks', array( $this, 'get_content_blocks_coll') );
		add_action( 'wp_ajax_get_cb_button_tpl', array( $this, 'blocks_button_tpl') );
		add_action( 'wp_ajax_ceux_upload_image', array( $this, 'cb_upload_image') );
		add_action( 'wp_ajax_fetch_cb_oembed', array( $this, 'cb_fetch_oembed') );
	}

	function init() {

		// add content blocks support
		add_post_type_support( 'post', self::FEATURE );

		// remove default post editor
		remove_post_type_support( 'post', 'editor' );
	}

	function enqueue_scripts(){
		wp_register_script( 'tinymce_4', '//tinymce.cachefly.net/4.0/tinymce.min.js', null, '4.0', true );
		wp_register_script( 'ceux-main-js',	$this->plugin_dir . 'js/main.js', array( 'backbone', 'jquery-ui-sortable'), self::VERSION, true );
	}

	function enqueue_styles(){
		wp_register_style( 'ceux-style-css', $this->plugin_dir . 'css/style.css', array(), self::VERSION );
	}

	function print_scripts(){
		global $pagenow;

		if( get_post_type() == 'post' && ( $pagenow == 'post-new.php' || $pagenow == 'post.php' ) ){

			$options = $this->get_plupload_instance();

			wp_enqueue_script( 'tinymce_4' );				// tinyMCE 4
			wp_enqueue_script( 'ceux-main-js' );
			wp_localize_script( 'ceux-main-js', 'ceux_plupload', $options );

		}

	}

	function print_styles(){
		global $pagenow;

		if( get_post_type() == 'post' && ( $pagenow == 'post-new.php' || $pagenow == 'post.php' ) ){
			wp_enqueue_style( 'ceux-style-css' );
		}

	}


	/*
	* Returns the global content blocks collection.
	*
	*/
	function register_content_blocks(){
		global $wp_content_blocks_tpl;

		// text
		register_content_block( array(
			'name' => __( 'Text' ),
			'slug' => 'text',
			'icon' => 'dashicons-format-aside',
			'view' => 'textView',
		), 'cb_text_tpl', true );

		// image
		register_content_block( array(
			'name' => __( 'Image' ),
			'slug' => 'image',
			'icon' => 'dashicons-format-image',
			'view' => 'imgView',
		), 'cb_img_tpl', true );

		// additional view for image content block
		$wp_content_blocks_tpl[] = array( 
			'slug' => 'image-placeholder', 
			'callback' => 'cb_img_placeholder_tpl', 
			'is_main' => false 
		);

		// gallery
		register_content_block( array(
			'name' => __( 'Gallery' ),
			'slug' => 'gallery',
			'icon' => 'dashicons-format-gallery',
			'view' => 'galleryView',
		), 'cb_gallery_tpl', true );

		// additional view for gallery content block
		$wp_content_blocks_tpl[] = array( 
			'slug' => 'gallery-placeholder', 
			'callback' => 'cb_gallery_placeholder_tpl', 
			'is_main' => false 
		);

		// additional subview for gallery content block
		$wp_content_blocks_tpl[] = array( 
			'slug' => 'gallery-img-tpl', 
			'callback' => 'cb_gallery_img_tpl', 
			'is_main' => false 
		);

		// Audio
		register_content_block( array(
			'name' => __( 'Audio' ),
			'slug' => 'audio',
			'icon' => 'dashicons-format-audio',
			'view' => 'audioView',
		), 'cb_audio_tpl', true );

		// additional subview for audio content block
		$wp_content_blocks_tpl[] = array( 
			'slug' => 'audio-placeholder-tpl', 
			'callback' => 'cb_audio_placeholder_tpl', 
			'is_main' => false 
		);

		// video
		register_content_block( array(
			'name' => __( 'Video' ),
			'slug' => 'video',
			'icon' => 'dashicons-format-video',
			'view' => 'videoView',
		), 'cb_video_tpl', true );

		// additional subview for video content block
		$wp_content_blocks_tpl[] = array( 
			'slug' => 'video-placeholder-tpl', 
			'callback' => 'cb_video_placeholder_tpl', 
			'is_main' => false 
		);

		// Quote
		register_content_block( array(
			'name' => __( 'Quote' ),
			'slug' => 'quote',
			'icon' => 'dashicons-format-quote',
			'view' => 'quoteView',
		), 'cb_quote_tpl', true );

		// Code
		register_content_block( array(
			'name' => __( 'Code' ),
			'slug' => 'code',
			'icon' => 'dashicons-format-status',
			'group' => 'other',
			'view' => 'codeView',
		), 'cb_code_tpl', true );

		// Tweet
		register_content_block( array(
			'name' => __( 'Tweet' ),
			'slug' => 'tweet',
			'icon' => 'dashicons-twitter1',
			'group' => 'other',
			'view' => 'tweetView',
		), 'cb_tweet_tpl', true );

		// Embed
		register_content_block( array(
			'name' => __( 'Embed' ),
			'slug' => 'embed',
			'icon' => 'dashicons-welcome-add-page',
			'group' => 'other',
			'view' => 'embedView',
		), 'cb_embed_tpl', true );

		// // Social
		// register_content_block( array(
		// 	'name' => __( 'Social' ),
		// 	'slug' => 'social',
		// 	'icon' => 'dashicons-format-chat',
		// 	'group' => 'other'
		// ) );

		// // Map
		// register_content_block( array(
		// 	'name' => __( 'Map' ),
		// 	'slug' => 'map',
		// 	'icon' => 'dashicons-location',
		// 	'group' => 'other'
		// ) );

		// // Slides
		// register_content_block( array(
		// 	'name' => __( 'Slides' ),
		// 	'slug' => 'slides',
		// 	'icon' => 'dashicons-slides',
		// 	'group' => 'other'
		// ) );

		// // Calendar
		// register_content_block( array(
		// 	'name' => __( 'Calendar' ),
		// 	'slug' => 'calendar',
		// 	'icon' => 'dashicons-calendar',
		// 	'group' => 'other'
		// ) );

		// // Chart
		// register_content_block( array(
		// 	'name' => __( 'Chart' ),
		// 	'slug' => 'chart',
		// 	'icon' => 'dashicons-bargraph',
		// 	'group' => 'other'
		// ) );

	}

	/*
	* "Hacks" the post editor with custom markup and implements the 
	* initial markup needed for the content blocks editor. (this is temporary)
	*
	*/
	function content_blocks_markup(){ 
		global $post, $pagenow, $typenow;

		if( $typenow == 'post' && ( $pagenow == 'post-new.php' || $pagenow == 'post.php' ) ){
?>

	<div id="postdivrich" class="postarea">

		<div id="wp-editor-toolbar"></div>
		<div id="wp-content-wrap" class="wp-core-ui wp-editor-wrap">
			<div id="wp-content-editor-container" class="wp-editor-container">
				<div id="content-blocks">
					<div id="post-placeholder">
						<h1><?php _e( 'Insert Content' ) ?></h1>
						<p><?php _e( 'Click "Add Content Block" and select a Content Block to start editing your post.' ) ?></p>
					</div>
				</div>
				<textarea class="wp-editor-area" style="display:none;" cols="40" name="content" id="content"><?php echo get_post_field( 'post_content', $post->ID ); ?></textarea>
			</div>
		</div>

	</div>

		<div id="wp-blocks">
			<a href="#" id="add-block"><span class="dashicons dashicons-plus-small"></span><?php _e( 'Add Content Block' ) ?></a>
			<div id="blocksSelect">
				<span class="arrow-up"></span>
				<div id="search-container"><span class="dashicons dashicons-search"></span>
					<input type="text" name="blocks-search" id="blocks-search" value="" placeholder="<?php _e( 'Search for blocks to add' ) ?>">
				</div>
				<div id="blocks-container">
					<div class="blocks-group" id="defaults-container"></div>
					<div class="blocks-group" id="others-container"></div>											
					<div class="blocks-group" id="results-container"></div>											
				</div>
			</div>
		</div>

		<!-- templates for every content block -->
		<?php $this->build_cb_templates() ?>

	<?php 
		}
	}

	function build_cb_templates(){
		global $wp_content_blocks_tpl;

		foreach( $wp_content_blocks_tpl  as $cb_tpl){

			$view = isset( $cb_tpl['view'] ) ? $cb_tpl['view'] : null;

			register_content_block_view( $cb_tpl['slug'], $cb_tpl['callback'], $cb_tpl['is_main'], $view );
		}
	}

	/*
	* Returns the global content blocks collection.
	*
	*/
	function get_content_blocks_coll(){
		global $wp_content_blocks;

		// send back data as JSON response
		wp_send_json( $wp_content_blocks );

	}

	/*
	* Returns the content block trigger button template.
	*
	*/
	function blocks_button_tpl(){
		$tpl = '<div class="customBlock" data-type="<%= slug %>"><span class="block-image dashicons <%= icon %>"></span><%= name %></div>';

		die( apply_filters( 'content_blocks_button_tpl', $tpl ) );
	}

	// some code for get a plupload options instance
	// borrowed from http://wordpress.org/extend/plugins/drag-drop-featured-image/ (Jonathan Lundström)
	function get_plupload_instance(){

		global $post;

		$plupload_options = array(
			'runtimes'            => 'html5,silverlight,flash,html4',
			'file_data_name'      => 'ceux-upload',
			'multiple_queues'     => false,
			'max_file_size'       => wp_max_upload_size().'b',
			'url'                 => admin_url('admin-ajax.php'),
			'flash_swf_url'       => includes_url('js/plupload/plupload.flash.swf'),
			'silverlight_xap_url' => includes_url('js/plupload/plupload.silverlight.xap'),
			'filters'             => array(
				array(
					'title' => __( 'Allowed Files', $this->plugin_slug ),
					'extensions' => implode(',', array('jpg', 'jpeg', 'png', 'gif') )
				)
			),
			'multipart'           => true,
			'urlstream_upload'    => true,

			// Additional parameters:
			'multipart_params'    => array(
				'_ajax_nonce' => wp_create_nonce( 'img-upload' ),
				'action'      => 'ceux_upload_image',
				'postID'	  => $post->ID
			),
		);

		// Apply filters to initiate plupload:
		return apply_filters( 'plupload_init', $plupload_options );

	}

	/**
	 * File upload handler.
	 */
	function cb_upload_image(){


		// Check referer, die if no ajax:
		check_ajax_referer( 'img-upload' );

		/// Upload file using Wordpress functions:
		$file = $_FILES['ceux-upload'];

		$status = wp_handle_upload( $file, array(
			'test_form' => true,
			'action' => 'ceux_upload_image'
		) );

		// Fetch post ID:
		$post_id = $_POST['postID'];

		// Insert uploaded file as attachment:
		$attach_id = wp_insert_attachment( array(
			'post_mime_type' => $status['type'],
			'post_title' => preg_replace( '/\.[^.]+$/', '', basename( $file['name'] ) ),
			'post_content' => '',
			'post_status' => 'inherit'
		), $status['file'], $post_id );

		// Include the image handler library:
		require_once( ABSPATH . 'wp-admin/includes/image.php' );

		// Generate meta data and update attachment:
		$attach_data = wp_generate_attachment_metadata( $attach_id, $status['file'] );
		wp_update_attachment_metadata( $attach_id, $attach_data );

		// get meta data of the generated attachment
		$data = wp_get_attachment_metadata( $attach_id );

		// build our custom array for JSON response
		$response = array(
			'id' => $attach_id,
			'link' => get_attachment_link( $attach_id ),
			'caption' => $data['image_meta']['caption'],
			'sizes' => array()
		);

		foreach ( $data['sizes'] as $key => $size ) {

			$url = wp_get_attachment_image_src( $attach_id, $key );

			$response['sizes'][ $key ] = array(
				'width' => $size['width'],
				'height' => $size['height'],
				'url' => $url[0]
			);
		}

		// set full size
		$full_url = wp_get_attachment_image_src( $attach_id, 'full' );
		
		$response['sizes']['full'] = array(
			'width' => $data['width'],
			'height' => $data['height'],
			'url' => $full_url[0]
		);

		// Return response and exit:
		wp_send_json( $response );
	}

	// fetch oEmbed
	function cb_fetch_oembed(){
		$url = $_REQUEST['url'];
		$media = $_REQUEST['media'];

		$response = array();

		switch ( $media ) {
			case 'video':
				$response['thumb'] = $this->get_video_thumb( $url );
				$response['html'] = '<div class="videoWrapper">'. wp_oembed_get( $url ) .'</div>';
				break;
			case 'audio':
				$response['html'] = '<div class="audioWrapper">'. wp_oembed_get( $url ) .'</div>';
				break;
		}

		wp_send_json( $response );
	}

	// check if is youtube or vimeo, probably it will need to be adapted to the rest of providers
	function get_video_thumb( $url ){

	    $url = parse_url( $url );
	    if( $url['host'] == 'www.youtube.com' || $url['host'] == 'youtube.com' ){
	        $array = explode( "&", $url['query'] );
	        return "http://img.youtube.com/vi/" . substr( $array[0], 2 ) . "/0.jpg";
	    } else if( $url['host'] == 'www.vimeo.com' || $url['host'] == 'vimeo.com' ){
	        $hash = json_decode( file_get_contents( "http://vimeo.com/api/v2/video/" . substr( $url['path'], 1 ). ".json") );
	        return $hash[0]->thumbnail_large;
	    } 
	}

}

global $wp_content_blocks;
$wp_content_blocks = array();
WP_Content_Blocks::get_instance();

function register_content_block_group( $slug, $args ) {
	global $wp_content_blocks;
	$wp_content_blocks[$slug] = array(
		'blocks' => array(),
		'args' => $args
	);
}


/**
 * Register a Content Block
 * @param  Array $args
 * @param  Function $template
 * @param  Bool $is_main
 * @return null
 */
function register_content_block( $args, $template, $is_main ) {

	global $wp_content_blocks;
	global $wp_content_blocks_tpl;

	$defaults = array(
		'name' => '',						// block label
		'slug' => 'wp-'. $args['slug'],		// slug for the content-block type
		'icon' => 'dashicons-cog',			// dashicon icon
		'group' => 'default',				// if is a default block, true, otherwise, false
		'view' => 'textView'
	);

	$params = wp_parse_args( $args, $defaults );

	$wp_content_blocks[] = $params;

	$wp_content_blocks_tpl[] = array(
		'slug' => 'wp-'. $params['slug'],
		'callback' => $template,
		'is_main' => $is_main,
		'view' => $params['view']
	);
}


/**
 * Build Content Block Template
 * @param  String $slug
 * @param  function $callback
 * @param  Bool $is_main
 * @return Template
 */
function register_content_block_view( $slug, $callback, $is_main, $view ){ ?>

	<!-- <?php echo $slug ?>-->
	<script type="text/template" id="<?php echo $slug ?>">
	<?php if( $is_main ): ?>
		<ul class="ctrlbar">
			<li class="move" title="<?php _e( 'Drag Content Block' ) ?>"><span class="dashicons dashicons-tinymce-justify"></span></li>
			<li class="move-up" title="<?php _e( 'Move Up' ) ?>"><span class="dashicons dashicons-arr-up"></span></li>
			<li class="move-down" title="<?php _e( 'Move Down' ) ?>"><span class="dashicons dashicons-arr-down"></span></li>
		</ul>

		<div class="remove" title="<?php _e( 'Remove Content Block' ) ?>"><span class="dashicons dashicons-no"></span></div>

		<?php $data_view = $view ? 'data-view="'. $view .'"' : '' ?>

		<div id="<%= wp_id %>" class="<%= block_type %>" <?php echo $data_view ?>>
			<?php call_user_func( $callback ) //insert block template markup here ?>
		</div>

	<?php else: ?>
		<?php call_user_func( $callback ) //insert block template markup here ?>
	<?php endif; ?>

	</script> 

<?php
}

function get_content_blocks() {
	global $wp_content_blocks;
	return $wp_content_blocks;
}

// templates for each content block

function cb_text_tpl(){ ?>
	<div class="wp-block editable" id="text-<%= wp_id %>" placeholder="<?php _e( 'Type here...' ) ?>">
		<%= block_content %>
	</div>
<?php
}

function cb_img_tpl(){ ?>
	<div class="wp-block drag-drop" id="wp-img-ui-<%= wp_id %>">
		<div class="drag-drop-area supports-drag-drop" id="wp-drag-drop-<%= wp_id %>">
			<h2 class="block-title"><?php _e( 'Add an Image' ); ?></h2>
			<a href="#" class="open-modal" id="wp-browse-button-<%= wp_id %>">
				<span class="dashicons dashicons-format-image"></span>
				<span class="label"><?php _e( 'Drop an image here or click to upload' ); ?></span>
			</a>
		</div>
	</div>
<?php
}

function cb_img_placeholder_tpl(){ ?>
	<div class="img-bar">
		<ul>
			<li class="opt-align align-none selected"><span class="dashicons dashicons-align-none"></span></li>
			<li class="opt-align align-left"><span class="dashicons dashicons-align-left"></span></li>
			<li class="opt-align align-center"><span class="dashicons dashicons-align-center"></span></li>
			<li class="opt-align align-right"><span class="dashicons dashicons-align-right"></span></li>
			<li class="separator"></li>
			<li class="opt-size size-thumbnail"><span class="icon-thumb"></span></li>
			<li class="opt-size size-medium"><span class="icon-medium"></span></li>
			<li class="opt-size size-full selected"><span class="icon-full"></span></li>
			<li class="separator"></li>
			<li class="remove-img"><span class="dashicons dashicons-xit"></span></li>
		</ul>
	</div>
	<div class="wp-image-placeholder">
		<img src="<%= url %>" id="<%= imgID %>" class="img-file alignnone">
		<input type="text" class="img-caption" placeholder="<?php _e( 'Enter your caption here' ) ?>" value="<%= caption %>">
	</div>
<?php
}

function cb_gallery_tpl(){ ?>
	<div class="wp-block drag-drop" id="wp-gallery-ui-<%= wp_id %>">
		<div class="drag-drop-area supports-drag-drop" id="wp-drag-drop-<%= wp_id %>">
			<h2 class="block-title"><?php _e( 'Add a Gallery' ); ?></h2>
			<a href="#" class="open-modal">
				<span class="dashicons dashicons-format-gallery"></span>
				<span class="label"><?php _e( 'Drop images here or click to upload' ); ?></span>
			</a>
		</div>
	</div>
<?php
}

function cb_gallery_placeholder_tpl(){ ?>
	<div class="wp-gallery-ui">
		<ul id="wp-gallery-sort-<%= wp_id %>" class="wp-gallery-list columns-<%= columns %>"></ul>

		<div class="wp-gallery-controls">
			
			<div class="wp-gallery-link-type">
				<p><?php _e( 'Link to:' ) ?>
				<a href="#" class="link-type<% if( link_to == 'url' ) { %> selected <% } %>" data-type="url"><span class="dashicons dashicons-admin-links"></span> <?php _e( 'Image Url' ) ?></a>
				<a href="#" class="link-type<% if( link_to == 'page' ) { %> selected <% } %>" data-type="page"><span class="dashicons dashicons-admin-page"></span> <?php _e( 'Attachment page' ) ?></a>
				</p>
			</div>

			<div class="wp-gallery-columns">
				<p><?php _e( 'Number of Columns:' ) ?> <input type="number" name="wp-gallery-cols<%= wp_id %>" id="wp-gallery-cols<%= wp_id %>" class="cols-num" min="1" max="9" value="6"></p>
			</div>

			<div class="wp-gallery-more">
				<a href="#" class="add-more"><span class="dashicons dashicons-plus"></span> <?php _e( 'Add more' ) ?></a>
			</div>

		</div>
	</div>
<?php
}

function cb_gallery_img_tpl(){ ?>
	<div class="gallery-image">
		<span class="img-remove"><span class="dashicons dashicons-no"></span></span>
		<img src="<%= thumb.url %>" id="<%= imgID %>">		
	</div>
<?php
}

function cb_audio_tpl(){ ?>
	<div class="wp-block drag-drop" id="wp-audio-ui-<%= wp_id %>">
		<div class="drag-drop-area supports-drag-drop" id="wp-drag-drop-<%= wp_id %>">
			<a href="#" class="open-modal">
				<span class="dashicons dashicons-format-audio"></span>
				<span class="label"><?php _e( 'Drop an audio file here to upload or click to add' ); ?></span>
			</a>	
			<p><?php _e( 'Or, enter a video URL from your favorite audio sharing service below:' ) ?></p>
			<div class="embed-wrapper">
				<input type="text" class="oembed-url" value="" placeholder="Paste an audio url into here">
				<button class="button oembed-fetch"><?php _e( 'Fetch Audio' ); ?></button></p>
			</div>
		</div>
	</div>
<?php
}

function cb_audio_placeholder_tpl(){ ?>
	<div class="audio-placeholder">
		<div class="audio-preview" title="<?php _e( 'Click to preview' ) ?>">
			<span class="audio-remove"><span class="dashicons dashicons-no" title="<?php _e( 'Remove audio' ) ?>"></span></span>
			<span class="dashicons dashicons-format-audio"></span>
			<p><?php _e( 'Click to preview' ) ?></p>
		</div>
	</div>
<?php
}

function cb_video_tpl(){ ?>
	<div class="wp-block drag-drop" id="wp-video-ui-<%= wp_id %>">
		<div class="drag-drop-area supports-drag-drop" id="wp-drag-drop-<%= wp_id %>">
			<a href="#" class="open-modal">
				<span class="dashicons dashicons-format-video"></span>
				<span class="label"><?php _e( 'Drop a video file here to upload or click to add' ); ?></span>
			</a>	
			<p><?php _e( 'Or, enter a video URL from your favorite video sharing service below:' ) ?></p>
			<div class="embed-wrapper">
				<input type="text" class="oembed-url" value="" placeholder="<?php _e( 'Paste a video url here' ) ?>">
				<button class="button oembed-fetch"><?php _e( 'Fetch Video' ); ?></button></p>
			</div>
		</div>
	</div>
<?php
}

function cb_video_placeholder_tpl(){ ?>
	<div class="video-placeholder">
		<span class="video-remove"><span class="dashicons dashicons-no" title="<?php _e( 'Remove video' ) ?>"></span></span>
		<button class="video-preview" title="<?php _e( 'Click to preview' ) ?>"><span class="dashicons dashicons-arrow-right"></span></button>
		<img src="<%= url %>">		
	</div>
<?php
}

function cb_code_tpl(){ ?>
	<pre>
		<code class="wp-block editable" id="code-<%= wp_id %>">
			<%= block_content %>
		</code>
	</pre>
<?php
}

function cb_tweet_tpl(){ ?>
	<h2><span class="title-image dashicons dashicons-twitter1"></span>Insert your tweet url</h2>
	<input type="text" class="input" value="<%= block_content %>">
<?php
}

function cb_quote_tpl(){ ?>
	<span class="quote-bg dashicons dashicons-format-quote"></span>
	<textarea id="quote_<%= wp_id %>" placeholder="<?php _e( 'Your quote here' ) ?>"><%= block_content %></textarea>
	<input type="text" class="input quote-who" value="" placeholder="<?php _e( 'Who said that?' ) ?>">
	<input type="text" class="input quote-where" value="" placeholder="<?php _e( 'Where did it was said?' ) ?>">
<?php
}

function cb_embed_tpl(){ ?>
	<textarea class="embed-text" placeholder="<?php _e( 'Insert your embed code here' ) ?>"><%= block_content %></textarea>
	<div class="embed-placeholder">
		<span class="edit"><span class="dashicons dashicons-edit"></span></span>
		<div class="placeholder-icon"><span class="dashicons dashicons-welcome-add-page"></span></div>
	</div>
<?php
}