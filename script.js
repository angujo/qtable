/**
 * Created by bangujo on 09/02/2017.
 */
(function ($) {
	$('.q-table').qTable({pageRows: [5, 100, 250, 1000], pgn: 2, searchCharacters: 1});
	$('.q-table-lazy').qTable({pageRows: [20, 100, 250, 1000], pgn: 2, searchCharacters: 1, lazyLoad: true});
	$('.q-reload').click(function () {
		reload();
	});
	$('.qb-destroy').click(function () {
		destroy($('table#basic-1'));
	});
	$('.q-link').click(function () {
		nLink($('.l-item').val());
	});
	$('a.test-click').click(function () {
		alert('Click Works:');
	})
})(jQuery);
function destroy($table) {
	$table.qTable('destroy');
	//$('table#table-ajax').qTable('reload');
}
function reload() {
	$('.q-table').qTable('destroy', 'url');
	//$('table#table-ajax').qTable('reload');
}
function nLink(url) {
	$('table#table-ajax').qTable(url);
}
