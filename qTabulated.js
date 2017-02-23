/**
 * Created by bangujo on 21/02/2017.
 */
;(function ($) {
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
		this.$element = $(element);

		this.settings = $.extend({}, defaults, options);
		this._options = options;
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
			hc.appendTo(h);
			tw.appendTo(h);
			fc.appendTo(h);
			h.insertAfter(this.$element);
			this.$element.appendTo(tw);
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
				if (this.ajax && !element.closest('th,td').data('qname').toString().length) continue;
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
							              f: '<input name="' + (element.closest('th,td').data('qname').toString().length && this.ajax ? element.closest('th,td').data('qname') : '') + '">'
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
			if (this.ajax.run && this.ajax.status) {
				this.ajax.run.abort();
			}
			this.ajax.run = $.ajax(me.ajax.url, {
				cache     : false,
				beforeSend: function () {
					me._overlayStart();
					me.ajax.status = true;
				},
				complete  : function () {
					me._overlayStop();
					me.ajax.status = false;
				},
				data      : {qtable: d}, dataType: 'json',
				error     : function () {
					if (!me.ajax.status) {
						alert('Error encountered. Log this on https://github.com/angujo/qtable');
					}
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
				this.ajax = {url: this.settings.url, data: {}, run: null, status: false};
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
				me._search();
			});
		},
		_search            : function (queryOnly, filtered) {
			filtered = filtered || false;
			queryOnly = queryOnly || false;
			var indices = this.ajax ? {} : [], me = this;
			this.$element.find('thead>tr.q-search input').each(function () {
				if (!$(this).val() || me.settings.searchCharacters > $(this).val().length) return true;
				if (me.ajax) {
					if ($(this).attr('name').toString().length) {
						indices[$(this).attr('name')] = $(this).val();
					}
				}
				else indices.push({i: $(this).closest('th,td').index(), v: $(this).val()});
			});
			if (this.ajax) {
				this.ajax.data.search = indices;
				if (queryOnly) return;
				this._ajax();
				return;
			}
			if (indices.length) {
				var d = filtered ? this.filteredData : JSON.parse(JSON.stringify(this.data));
				this.filteredData = [];
				for (var i = 0; i < d.length; i++) {
					var s = true;
					for (var j = 0; j < indices.length; j++) {
						if (d[i][indices[j].i].toString().toLowerCase().indexOf(indices[j].v.toString().toLowerCase()) == -1) {
							s = false;
							break;
						}
					}
					if (s) this.filteredData.push(d[i]);
				}
			} else {
				this.filteredData = filtered ? this.filteredData : [];
			}
			this.page = 1;
			this.dataCount = indices.length || filtered ? this.filteredData.length : this.data.length;
			this._setData();
		},
		_sort              : function (queryOnly, filtered) {
			filtered = filtered || false;
			queryOnly = queryOnly || false;
			var indices = this.ajax ? {} : [], me = this;
			this.$element.find('thead tr a.q-sorter.qsort-asc,thead tr a.q-sorter.qsort-desc').each(function () {
				if (me.ajax) {
					if ($(this).closest('th,td').data('qname').toString().length) {
						indices[$(this).closest('th,td').data('qname')] = ($(this).hasClass('qsort-desc') ? 'desc' : 'asc');
					}
				}
				else indices.push({i: $(this).closest('th,td').index(), o: $(this).hasClass('qsort-desc')});
			});
			if (this.ajax) {
				this.ajax.data.order = indices;
				if (queryOnly) return;
				this._ajax();
				return;
			}
			if (indices.length) {
				this.filteredData = filtered ? this.filteredData : JSON.parse(JSON.stringify(this.data));
				for (var i = 0; i < indices.length; i++) {
					(function (i, m) {
						m.filteredData.sort(function (a, b) {
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
					})(i, this);
				}
			} else {
				this.filteredData = filtered ? this.filteredData : [];
			}
			this._setData();
		},
		_overlayStart      : function () {
			if (!this.overlay) {
				this.overlay = $('<div class="qtable-overlay"><span>Loading Data...</span></div>');
				this.overlay.prependTo(this.$element.parent());
			}
			this.overlay.css({display: 'flex'});
		},
		_overlayStop       : function () {
			if (this.overlay) this.overlay.css({display: 'none'});
		}
	});

	var methods = {
		gotoPage: function (page) {
			this.page = page;
			if (this.ajax) this._ajax(); else this._setData();
		},
		reload  : function () {
			var set = this._options, $t = this.$element;
			this.destroy();
			$t.qTable(set);
		},
		refresh : function () {
			this.reload();
		},
		destroy : function () {
			this.$element.insertAfter(this.$header.parent());
			this.$header.parent().remove();
			this.$element.find('thead>tr.q-search').remove();
			this.$element.find('.q-searched').removeClass('q-searched');
			this.$element.find('.q-sorted').each(function () {
				$(this).html($(this).find('.q-sorter').html()).removeClass('q-sorted');
			});
			if (this.ajax) {
				//TODO should we clear the contents? Leave the page as is. For instances where user just needs to load data and stop
			} else {
				this.rows = this.data.length;
				this.page = 1;
				this._setData();
			}
			$.removeData(this.$element.get(0), "plugin_" + pluginName);
		},
		tester  : function () {
			console.log(arguments);
		}
	};

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function (options, opt_value) {
		var args = arguments;
		return this.each(function () {
			if (!$(this).is('table')) return true;
			if ((!options || (options && typeof options == 'object') || 'create' == options) && !$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new Plugin(this, options));
			} else {
				if (methods[options]) {
					if (!$.data(this, "plugin_" + pluginName)) return true;
					args = $.map(args, function (v) {
						return v;
					});
					args.shift();
					methods[options].apply($.data(this, "plugin_" + pluginName), args);
				}
			}
		});
	};
})(jQuery, Window, Document);