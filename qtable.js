/**
 * Created by bangujo on 09/02/2017.
 */

(function ($, window, document) {
    var qTable = {}, defaults = {search: true, sort: true};
    qTable.header = function (table) {
    };
    qTable.body = function (table, data, rows, page) {
        data = data || null;
        var start = (page - 1) * rows;
        if (!data || !data.length) {
            return 0;
        }
        $('tbody', table).html('');
        for (var i = 0; i < rows; i++) {
            var r = '<tr>';
            for (var j = 0; j < data[start].length; j++) {
                r += '<td>' + data[start][j] + '</td>';
            }
            start++;
            r += '</tr>';
            $('tbody', table).append(r);
        }
        return start;
    };
    qTable.tableData = function (table) {
        var data = [];
        $('tbody', table).find('tr').each(function () {
            var row = [];
            $(this).find('td,th').each(function () {
                row.push($(this).html());
            });
            data.push(row);
        });
        return data;
    };
    qTable.footer = function () {
    };
    qTable.footerControls = function (holder, pages, page) {
        var fc = $('<div class="qtable-fc"><div class="qtable-pd"></div><ul class="qtable-pagination"></ul></div>'), sp = [], s = 0, pgn = 7, mrgn = Math.ceil(pgn / 2), p = 0;
        page = page > pages ? pages : (page <= 0 ? 1 : page);
        if (pages <= pgn || page <= mrgn) {
            pgn = pages > pgn ? pgn : pages;
            for (p = 1; p <= pgn; p++) {
                sp.push(p);
            }
        } else {
            if (page >= (pages - (mrgn - 1))) {
                for (p = pages; p >= (pages - pgn); p--) {
                    sp.push(p);
                }
                sp.reverse();
            } else {
                s = page - (mrgn - 1);
                for (p = 0; p < pgn; p++) {
                    sp.push(s + p);
                }
            }
        }
        fc.find('.qtable-pd').html('Page <b>' + page + '</b> of <b>' + pages + '</b>');
        fc.find('.qtable-pagination').append('<li ' + (1 == sp[0] ? 'class="active"' : '') + '><a data-pg="1">|<</a></li>');
        fc.find('.qtable-pagination').append('<li ' + (1 == sp[0] ? 'class="active"' : '') + '><a data-pg="' + (page - 1) + '"><</a></li>');
        for (p = 0; p < sp.length; p++) {
            var a = sp[p] == page ? 'class="active"' : '';
            fc.find('.qtable-pagination').append('<li ' + a + '><a data-pg="' + sp[p] + '">' + sp[p] + '</a></li>');
        }
        fc.find('.qtable-pagination').append('<li ' + (pages == sp[(sp.length - 1)] ? 'class="active"' : '') + '><a data-pg="' + (page + 1) + '">></a></li>');
        fc.find('.qtable-pagination').append('<li ' + (pages == sp[(sp.length - 1)] ? 'class="active"' : '') + '><a data-pg="' + pages + '">>|</a></li>');
        holder.find('.qtable-fc').remove();
        fc.appendTo(holder);
        return fc;
    };
    qTable.load = function (holder, data, rows, pg) {
        pg = pg || 1;
        qTable.body(holder.find('table'), data, rows, pg);
        var pages = Math.ceil(data.length / rows);
        qTable.footerControls(holder, pages, pg);
        holder.off('click', 'li:not(.active) a').on('click', 'li:not(.active) a', function (e) {
            e.preventDefault();
            var pg = parseInt($(this).data('pg'));
            qTable.load(holder,data,rows,pg);
        });
    };
    qTable.init = function (table) {
        var holder = $('<div class="q-tabulated"></div>'), parent = table.parent(), data = [], rows = 20, pg = 2;
        table = table.clone(true);
        data = qTable.tableData(table);
        table.appendTo(holder);
        qTable.load(holder, data, rows);
        parent.html('').append(holder);
    };
    $.fn.qtable = function (options) {
        this.filter('table').each(function () {
            qTable.init($(this));
        });
        return this;
    };
})(jQuery, Window, Document);