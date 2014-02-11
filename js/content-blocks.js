/*globals window, document, $, jQuery */

window.wp = window.wp || {};
window.wp.contentBlocks = window.wp.contentBlocks || {};

(function ($, contentBlocks) {
	"use strict";
	
	var currentModal;

	function launchModal(context, title) {
		if (currentModal)
			currentModal.dialog( 'close' );
		
		currentModal = $('#wp-content-block-modal-' +  context).dialog({
			title: title,
			dialogClass : 'wp-dialog'
		});		
	}

    $(document).ready(function () {
		$('body').on( 'click', '#content-block-group-tabs a', function(e) {
			var elem = $(e.currentTarget), t;
					
			t = elem.attr('href');
			elem.parent().addClass('tabs').siblings('li').removeClass('tabs');
			
			$('#content-block-group-tabs').siblings('.tabs-panel').hide();
			$(t).show();
			
			return false;
		});
		
		$('body').on( 'click', '.block-list li', function(e) {
			var elem = $(e.currentTarget), context, callback, title;
					
			context = elem.data('context');		
			callback = elem.data('js-callback');
			title = elem.data('title');
			
			if ( context && callback && callback in contentBlocks ) {
				contentBlocks[callback](context, title);
			} else {
				// whatever the default behavior is
				launchModal(context, title);
			}
			
			return false;
		});
    });

}(jQuery, window.wp.contentBlocks));