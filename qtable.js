/**
 * Created by bangujo on 09/02/2017.
 */

(function ($) {
    var qTable = {}, defaults = {search: true, sort: true, rows: [10, 20, 50, 100], pages: 5, rowsCount: 10, data: [], pData: []};
    qTable.header = function (holder, options) {
        var qs = [], qr = $('<tr></tr>');
        holder.find('thead tr:last-child th').each(function () {
            if ($(this).data('qsearch')) qs.push('<td><input name="' + $(this).data('qsearch') + '"/></td>');
            else qs.push('<td></td>');
        });
        if (qs.length) {
            qr.append(qs.join(''));
            qr.appendTo(holder.find('thead'));
        }
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
    qTable.headerControls = function (holder, options) {
        var hc = $('<div class="qtable-hc"><label>Rows:<select></select></label></div>'), sel = '';
        for (var i = 0; i < options.rows.length; i++) {
            sel = options.rowsCount == options.rows[i] ? 'selected' : '';
            hc.find('select').append('<option value="' + options.rows[i] + '" ' + sel + '>' + options.rows[i] + '</option>')
        }
        hc.prependTo(holder);
    };
    qTable.staticLoad = function (options, holder, rows, pg) {
        pg = pg || 1;
        var s = ((pg - 1) * rows), e = (s + rows), fd = options.data.slice(s, e);
        qTable.body(holder.find('table'), fd, rows, pg);
        var pages = Math.ceil(options.data.length / rows);
        qTable.footerControls(holder, pages, pg, options.pages);
        holder.off('click', 'li:not(.active) a').on('click', 'li:not(.active) a', function (e) {
            e.preventDefault();
            var pg = parseInt($(this).data('pg'));
            qTable.staticLoad(options, holder, rows, pg);
        }).off('change', '.qtable-hc select').on('change', '.qtable-hc select', function (e) {
            e.preventDefault();
            qTable.staticLoad(options, holder, parseInt($(this).val()));
        });
    };
    qTable.query = function (holder, url, options, rows, pg) {
        pg = pg || 1;
        rows = rows || options.rowsCount;
        holder.find('table').data('qopts', JSON.stringify(options));
        $.ajax(url, {
            cache: false,
            beforeSend: function () {
                holder.find('.qtable-overlay').css({display: 'flex'});
            },
            complete: function () {
                holder.find('.qtable-overlay').css({display: 'none'});
            },
            data: {start: ((pg - 1) * rows), length: rows}, dataType: 'json',
            error: function () {
                alert('Error encountered. Log this on https://github.com/angujo/qtable');
            }, method: 'get',
            success: function (res) {
                var pages = Math.ceil(res.rows / rows);
                qTable.body(holder.find('table'), res.data, rows, pg);
                qTable.footerControls(holder, pages, pg, options.pages);
                holder.off('click', 'li:not(.active) a').on('click', 'li:not(.active) a', function (e) {
                    e.preventDefault();
                    pg = parseInt($(this).data('pg'));
                    qTable.query(holder, url, options, rows, pg);
                }).off('change', '.qtable-hc select').on('change', '.qtable-hc select', function (e) {
                    e.preventDefault();
                    options.rowsCount = parseInt($(this).val());
                    qTable.query(holder, url, options, options.rowsCount);
                });
            }
        });
    };
    qTable.dynamic = function (holder, url, options) {
        holder.prepend('<div class="qtable-overlay"><span>Loading Data...</span></div>');
        qTable.query(holder, url, options);
    };
    qTable.init = function (o_table, options) {
        var holder = $('<div class="q-tabulated"></div>'), tWrapper = $('<div class="qtable-responsive"></div>'),
            table = o_table.clone(true), data = qTable.tableData(table);
        table.data('qopts', JSON.stringify(options));
        table.appendTo(tWrapper);
        tWrapper.appendTo(holder);
        qTable.headerControls(holder, options);
        options.data = data;
        qTable.header(table, options);
        if (table.data('fetch')) qTable.dynamic(holder, table.data('fetch'), options);
        else qTable.staticLoad(options, holder, options.rowsCount);
        if (o_table.closest('.q-tabulated').length) {
            holder.insertAfter(o_table.closest('.q-tabulated'));
            o_table.closest('.q-tabulated').remove();
        }
        else {
            holder.insertAfter(o_table);
            o_table.remove();
        }
        holder.off('focusout', 'input').on('focusout', 'input', function () {
            var st = [];
            $(this).closest('tr').find('input').each(function () {
                if ($(this).val().length) {
                    var i = $(this).closest('td').index();
                    st.push({i: i, v: $(this).val()});
                }
            });
            if (table.data('fetch')) {
            }
            else {
                if (st.length > 0) {
                    options.data = $.grep(data, function (v, i) {
                        var s = 0;
                        for (var i = 0; i < st.length; i++) {
                            if (v[st[i].i].toLowerCase().indexOf(st[i].v.toLowerCase()) !== -1) s++;
                        }
                        return s == st.length;
                    });
                } else {
                    options.data = data;
                }
                qTable.staticLoad(options, holder, options.rowsCount);
            }
        });
    };
    $.fn.qTable = function (options) {
        this.filter('table').each(function () {
            if (typeof options !== 'object') {
                switch (options) {
                    case 'reload':
                        break;
                    default:
                        if (isURL(options) && 'reload') {
                            $(this).data('fetch', options);
                        }
                        break;
                }
                options = $(this).data('qopts') ? JSON.parse($(this).data('qopts')) : defaults;
            } else {
                options = $.extend(defaults, options, {});
                if (options.rowsCount != options.rows[0]) options.rowsCount = options.rows[0];
            }
            qTable.init($(this), options);
        });
        return this;
    };


    function isURL(str) {
        var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return pattern.test(str);
    }
})(jQuery, Window, Document);