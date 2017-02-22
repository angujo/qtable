/**
 * Created by bangujo on 21/02/2017.
 */
;(function ($, window, document, undefined) {
	"use strict";
	var pluginName = "qTable",
		defaults = {
			url             : null,
			sort            : false,
			search          : false,
			footer_url      : null,
			transistOut     : 'zoomOut',
			rowClick        : function ($row, $table) {
				//Nothing to do now
			},
			pageRows        : [20, 30, 50, 100],
			pgn             : 5,
			searchCharacters: 3
		};

	// The actual plugin constructor
	function Plugin(element, options) {
		this.element = element;
		this.$element = $(element).clone(true);

		this.settings = $.extend({}, defaults, options);
		//this._defaults = defaults;
		//this._name = pluginName;
		this.settings.pgn = parseInt(this.settings.pgn) < 5 ? 5 : parseInt(this.settings.pgn);
		this.ajax = null;
		this.page = 1;
		this.pages = 0;
		this.data = [];
		this.dataCount = 0;
		this.currentData = [];
		this.filteredData = [];
		this.overlay = null;
		this.rows = this.settings.pageRows[0];
		this._data_parameters();
		this.init();
	}

	// Avoid Plugin.prototype conflicts
	$.extend(Plugin.prototype, {
		init               : function () {
			var h = $('<div class="q-tabulated"></div>'),
				tw = $('<div class="qtable-responsive"></div>'),
				hc = $('<div class="qtable-hc"><label>Rows:<select></select></label></div>'),
				fc = $('<div class="qtable-fc"><div class="qtable-pd"></div><ul class="qtable-pagination"></ul></div>');
			this.$element.appendTo(tw);
			hc.appendTo(h);
			tw.appendTo(h);
			fc.appendTo(h);
			h.insertAfter($(this.element));
			$(this.element).remove();
			this.$header = hc;
			//this.$body = tw;
			this.$footer = fc;
			this._header();
			this._body();
			this._actions();
		},
		_header            : function () {
			var me = this, thSearch = [], thCount = 0;
			for (var i = 0; i < this.settings.pageRows.length; i++) {
				this.$header.find('select').append('<option value="' + this.settings.pageRows[i] + '">' + this.settings.pageRows[i] + '</option>');
			}
			this.$element.find('thead>tr:last-child>th').each(function () {
				thCount++;
				if ($(this).data('qoptions')) {
					me._qoptions($(this), thSearch);
				}
			});
			if (thSearch.length) {
				var sr = $('<tr class="q-search"></tr>');
				for (var j = 0; j < thCount; j++) {
					var th = '<th></th>';
					for (var k = 0; k < thSearch.length; k++) {
						if (thSearch[k].i == j) {
							th = '<th>' + thSearch[k].f + '</th>';
							thSearch.splice(k, 1);
							break;
						}
					}
					sr.append(th);
				}
				sr.insertAfter(this.$element.find('thead>tr:last-child'));
			}
		}, _qoptions       : function (element, searches) {
			var options = element.data('qoptions').split(',');
			for (var i = 0; i < options.length; i++) {
				if (this.ajax && !element.closest('th,td').data('qname')) continue;
				switch (options[i].trim()) {
					case 'sort':
						if (element.hasClass('q-sorted')) continue;
						element.addClass('q-sorted');
						element.html('<a class="q-sorter" href="javascript:void(0);">' + element.text() + '</a>');
						break;
					case 'search':
						if (element.hasClass('q-searched')) continue;
						element.addClass('q-searched');
						searches.push({
							              i: element.closest('th,td').index(),
							              f: '<input name="qsearch[' + (element.closest('th,td').data('qname') && this.ajax ? element.closest('th,td').data('qname') : '') + ']">'
						              });
						break;
				}
			}
		},
		_body              : function () {
			if (!this.$element.find('thead').length) {
				alert('Tables should have <THEAD/> tags!');
				return;
			}
			if (!this.$element.find('tbody').length) {
				var $b = $('<tbody></tbody>');
				this.$element.find('thead').siblings().appendTo($b);
				$b.insertAfter(this.$element.find('thead'));
			}
			if (this.ajax) this._ajax(); else this._basic();
		}, _ajax           : function () {
			var me = this, d = {start: ((me.page - 1) * me.rows), length: me.rows};
			d = $.extend({}, d, this.ajax.data);
			$.ajax(me.ajax.url, {
				cache     : false,
				beforeSend: function () {
					me._overlayStart();
				},
				complete  : function () {
					me._overlayStop();
				},
				data      : d, dataType: 'json',
				error     : function () {
					alert('Error encountered. Log this on https://github.com/angujo/qtable');
				}, method : 'get',
				success   : function (res) {
					me.data = res.data;
					me.dataCount = res.rows;
					me._setData();
				}
			});
		}, _basic          : function () {
			this._overlayStart();
			var d = [];
			this.$element.find('tbody>tr').each(function () {
				var row = [];
				$(this).find('td,th').each(function () {
					row.push($(this).html());
				});
				d.push(row);
			});
			this.data = d;
			this.dataCount = d.length;
			this._setData();
		}, _data_parameters: function () {
			this.settings.url = this.$element.data('url') ? this.$element.data('url') : this.settings.url;
			if (this.settings.url) {
				this.ajax = {url: this.settings.url, data: {}};
			}
		}, _setData        : function () {
			if (this.ajax) {
				this.currentData = this.data
			} else {
				var s = ((this.page - 1) * this.rows), l = s + this.rows;
				this.currentData = this.filteredData.length ? this.filteredData.slice(s, l) : this.data.slice(s, l);
			}
			this._remove();
			for (var i = 0; i < this.currentData.length; i++) {
				var r = [];
				for (var j = 0; j < this.currentData[i].length; j++) r.push('<td>' + this.currentData[i][j] + '</td>');
				this.$element.find('tbody').append('<tr>' + r.join('') + '</tr>');
			}
			this._footer();
			this._overlayStop();
		}, _remove         : function () {
			//TODO some animations for out
			this.$element.find('tbody').html("");
		},
		_footer            : function () {
			var pgs = Math.ceil(this.dataCount / (this.rows <= 0 ? 1 : this.rows)), sp = [], s = 0, p = 0,
				pgmrg = (this.settings.pgn % 2) ? this.settings.pgn : (this.settings.pgn + 1);
			var mrgn = Math.ceil(pgmrg / 2);
			this.page = this.page > pgs ? pgs : (this.page <= 0 ? 1 : this.page);
			if (pgs <= pgmrg || this.page <= mrgn) {
				var _pgn = pgs > pgmrg ? pgmrg : pgs;
				for (p = 1; p <= _pgn; p++) {
					sp.push(p);
				}
			} else if (this.page >= (pgs - (mrgn - 1))) {
				for (p = pgs; p >= (pgs - pgmrg); p--) {
					sp.push(p);
				}
				sp.reverse();
			} else {
				s = this.page - (mrgn - 1);
				for (p = 0; p < pgmrg; p++) {
					sp.push(s + p);
				}
			}
			this.$footer.find('.qtable-pd').html('');
			this.$footer.find('.qtable-pagination').html('');
			this.$footer.show();
			if (sp.length > 1) {
				this.$footer.find('.qtable-pd').html("Page <b>" + this.page + "</b> of <b>" + pgs + "</b>");
				if (1 < sp[0]) {
					this.$footer.find('.qtable-pagination').append('<li><a data-pg="1">|<</a></li>');
					this.$footer.find('.qtable-pagination').append('<li><a data-pg="' + (this.page - 1) + '"><</a></li>');
				}
				for (p = 0; p < sp.length; p++) {
					var a = sp[p] == this.page ? 'class="active"' : '';
					this.$footer.find('.qtable-pagination').append('<li ' + a + '><a data-pg="' + sp[p] + '">' + sp[p] + '</a></li>');
				}
				if (pgs > sp[(sp.length - 1)]) {
					this.$footer.find('.qtable-pagination').append('<li><a data-pg="' + (this.page + 1) + '">></a></li>');
					this.$footer.find('.qtable-pagination').append('<li><a data-pg="' + pgs + '">>|</a></li>');
				}
			} else {
				this.$footer.hide();
			}
		},
		_actions           : function () {
			var me = this;
			this.$footer.on('click', 'li:not(.active) a', function () {
				me.page = $(this).data('pg');
				if (me.ajax) me._ajax(); else me._setData();
			});
			this.$header.on('change', 'select', function () {
				me.page = 1;
				me.rows = parseInt($(this).val());
				if (me.ajax) me._ajax(); else me._setData();
			});
			this.$element.on('click', 'thead>tr>th>a.q-sorter', function () {
				if ($(this).hasClass('qsort-asc')) {
					$(this).removeClass('qsort-asc').addClass('qsort-desc');
				} else if ($(this).hasClass('qsort-desc')) {
					$(this).removeClass('qsort-desc');
				} else {
					$(this).addClass('qsort-asc');
				}
				me._sort();
			});
			this.$element.on('keyup', 'thead>tr.q-search input', function () {
				if (me.settings.searchCharacters > $(this).val().length) return;
				console.log($(this).val());
			});
		}, _sort           : function (queryOnly) {
			queryOnly = queryOnly || false;
			var indices = [], me = this;
			this.$element.find('thead tr a.q-sorter.qsort-asc,thead tr a.q-sorter.qsort-desc').each(function () {
				if (me.ajax) {
					if ($(this).closest('th,td').data('qname')) {
						indices.push([$(this).closest('th,td').data('qname'), ($(this).hasClass('qsort-desc') ? 'desc' : 'asc')]);
					}
				}
				else indices.push({i: $(this).closest('th,td').index(), o: $(this).hasClass('qsort-desc')});
			});
			if (this.ajax) {
				this.ajax.data.push({order: indices});
				if (queryOnly) return;
				return;
			}
			if (indices.length) {
				this.filteredData = this.data;
				for (var i = 0; i < indices.length; i++) {
					this.filteredData.sort(function (a, b) {
						var a1 = a[indices[i].i],
							b1 = b[indices[i].i];
						if (indices[i].o) {
							a1 = b[indices[i].i];
							b1 = a[indices[i].i];
						}
						if (!isNaN(a1) && !isNaN(b1)) {
							return a1 - b1;
						}
						a1 = a1.toString();
						b1 = b1.toString();
						return a1.localeCompare(b1);
					});
				}
			} else {
				this.filteredData = [];
			}
			this._setData();
		}, _overlayStart   : function () {
			if (!this.overlay) {
				this.overlay = $('<div class="qtable-overlay"><span>Loading Data...</span></div>');
				this.overlay.prependTo(this.$element.parent());
			}
			this.overlay.css({display: 'flex'});
		}, _overlayStop    : function () {
			if (this.overlay) this.overlay.css({display: 'none'});
		}
	});

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function (options) {
		return this.each(function () {
			if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new Plugin(this, options));
			}
		});
	};
})(jQuery, Window, Document);