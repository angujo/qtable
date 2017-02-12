/**
 * Created by bangujo on 09/02/2017.
 */
(function ($) {
    $('.q-table').qTable({rows:[25,45,60,250]});
    $('.q-reload').click(function () {
        reload();
    });
    $('.q-link').click(function () {
        nLink($('.l-item').val());
    });
})(jQuery);
function reload() {
    $('table#table-ajax').qTable('reload');
}
function nLink(url) {
    $('table#table-ajax').qTable(url);
}