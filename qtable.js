/**
 * Created by bangujo on 09/02/2017.
 */

(function ($, window, document) {
    var qTable = {}, defaults = {search: true, sort: true, pagination: {rows: [10, 20, 50, 100], pages: 5}};
    qTable.header = function (table) {
    };
    qTable.body = function (table, fdata) {
        fdata = fdata || [];
        $('tbody', table).html('');
        for (var i = 0; i < fdata.length; i++) {
            var r = '<tr>';
            for (var j = 0; j < fdata[i].length; j++) {
                r += '<td>' + fdata[i][j] + '</td>';
            }
            r += '</tr>';
            $('tbody', table).append(r);
        }
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
    qTable.footerControls = function (holder, pages, page, pgn) {
        pgn = pgn || 5;
        var fc = $('<div class="qtable-fc"><div class="qtable-pd"></div><ul class="qtable-pagination"></ul></div>'), sp = [], s = 0, mrgn = Math.ceil(pgn / 2), p = 0;
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
        fc.find('.qtable-pagination').append('<li ' + (1 == sp[0] ? 'class="hidden"' : '') + '><a data-pg="1">|<</a></li>');
        fc.find('.qtable-pagination').append('<li ' + (1 == sp[0] ? 'class="hidden"' : '') + '><a data-pg="' + (page - 1) + '"><</a></li>');
        for (p = 0; p < sp.length; p++) {
            var a = sp[p] == page ? 'class="active"' : '';
            fc.find('.qtable-pagination').append('<li ' + a + '><a data-pg="' + sp[p] + '">' + sp[p] + '</a></li>');
        }
        fc.find('.qtable-pagination').append('<li ' + (pages == sp[(sp.length - 1)] ? 'class="hidden"' : '') + '><a data-pg="' + (page + 1) + '">></a></li>');
        fc.find('.qtable-pagination').append('<li ' + (pages == sp[(sp.length - 1)] ? 'class="hidden"' : '') + '><a data-pg="' + pages + '">>|</a></li>');
        holder.find('.qtable-fc').remove();
        fc.appendTo(holder);
        return fc;
    };
    qTable.headerControls = function (holder, rows) {
        var hc = $('<div class="qtable-hc"><label>Rows:<select></select></label></div>');
        for (var i = 0; i < rows.length; i++) {
            hc.find('select').append('<option value="' + rows[i] + '">' + rows[i] + '</option>')
        }
        hc.prependTo(holder);
    };
    qTable.staticLoad = function (options, holder, data, rows, pg) {
        pg = pg || 1;
        var s = ((pg - 1) * rows), e = (s + rows), fd = data.slice(s, e);
        qTable.body(holder.find('table'), fd, rows, pg);
        var pages = Math.ceil(data.length / rows);
        qTable.footerControls(holder, pages, pg, options.pagination.pages);
        holder.off('click', 'li:not(.active) a').on('click', 'li:not(.active) a', function (e) {
            e.preventDefault();
            var pg = parseInt($(this).data('pg'));
            qTable.staticLoad(options, holder, data, rows, pg);
        }).off('change', '.qtable-hc select').on('change', '.qtable-hc select', function (e) {
            e.preventDefault();
            qTable.staticLoad(options, holder, data, parseInt($(this).val()));
        });
    };
    qTable.query = function (url, start, length) {
        var req = $.ajax(url, {
            cache: false,
            complete: function () {
            },
            data: {start: start, length: length}, dataType: 'json', error: function (jq, st, err) {
                alert(err);
            }, method: 'get',
            success: function () {

            }
        });
    };
    qTable.init = function (o_table, options) {
        var holder = $('<div class="q-tabulated"></div>'),
            table = o_table.clone(true),
            data = qTable.tableData(table);
        table.appendTo(holder);
        qTable.headerControls(holder, options.pagination.rows);
        qTable.staticLoad(options, holder, data, options.pagination.rows[0]);
        holder.insertAfter(o_table);
        o_table.remove();
    };
    $.fn.qtable = function (options) {
        options = $.extend(defaults, options, {});
        this.filter('table').each(function () {
            qTable.init($(this), options);
        });
        return this;
    };
})(jQuery, Window, Document);