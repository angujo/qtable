/**
 * Created by bangujo on 21/02/2017.
 */
;(function ($, window, document, undefined) {
	"use strict";
	var pluginName = "qTable",
	    defaults   = {
		    url        : null,
		    sort       : false,
		    search     : false,
		    footer_url : null,
		    transistOut: 'zoomOut',
		    rowClick   : function ($row, $table) {
			    //Nothing to do now
		    },
		    pageRows   : [20, 30, 50, 100],
		    pgn        : 5
	    };

	// The actual plugin constructor
	function Plugin(element, options) {
		this.element = element;
		this.$element = $(element).clone(true);

		this.settings = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.page = 1;
		this.pages = 0;
		this.data = [];
		this.dataCount = 0;
		this.currentData = [];
		this.rows = this.settings.pageRows[0];
		this._data_parameters();
		this.init();
	}

	// Avoid Plugin.prototype conflicts
	$.extend(Plugin.prototype, {
		init               : function () {
			var h  = $('<div class="q-tabulated"></div>'),
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
			this.$body = tw;
			this.$footer = fc;
			this._header();
			this._body();
			this._actions();
		},
		_header            : function () {
			for (var i = 0; i < this.settings.pageRows.length; i++) {
				this.$header.find('select').append('<option value="' + this.settings.pageRows[i] + '">' + this.settings.pageRows[i] + '</option>');
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
			if (this.settings.url) this._ajax(); else this._basic();
		}, _ajax           : function () {
		}, _basic          : function () {
			var d = [];
			this.$element.find('tbody>tr').each(function (e) {
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
		}, _setData        : function () {
			var s = ((this.page - 1) * this.rows);
			this.currentData = [];
			this.currentData = (this.settings.url ? this.data : this.data.slice(s, s + this.rows));
			this._remove();
			for (var i = 0; i < this.currentData.length; i++) {
				var r = [];
				for (var j = 0; j < this.currentData[i].length; j++) r.push('<td>' + this.currentData[i][j] + '</td>');
				this.$element.find('tbody').append('<tr>' + r.join('') + '</tr>');
			}
			this._footer();
		}, _remove         : function () {
			//TODO some animations for out
			this.$element.find('tbody').html("");
		},
		_footer            : function () {
			var pgs = Math.ceil(this.dataCount / (this.rows <= 0 ? 1 : this.rows)), sp = [], s = 0, mrgn = Math.ceil(this.settings.pgn / 2), p = 0;
			mrgn = (mrgn % 2) ? mrgn : mrgn + 1;
			this.page = this.page > pgs ? pgs : (this.page <= 0 ? 1 : this.page);
			if (pgs <= this.settings.pgn || this.page <= mrgn) {
				console.log(this.settings.pgn);
				var _pgn = pgs > this.settings.pgn ? this.settings.pgn : pgs;
				for (p = 1; p <= _pgn; p++) {
					sp.push(p);
				}
			} else {
				if (this.page >= (pgs - (mrgn - 1))) {
					for (p = pgs; p >= (pgs - this.settings.pgn); p--) {
						sp.push(p);
					}
					sp.reverse();
				} else {
					s = this.page - (mrgn - 1);
					for (p = 0; p < this.settings.pgn; p++) {
						sp.push(s + p);
					}
				}
			}
			console.log(this.rows, pgs, sp, this.page);
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
			this.$footer.on('click', 'li:not(.active) a', function (e) {
				me.page = $(this).data('pg');
				me._setData();
			});
			this.$header.on('change', 'select', function () {
				me.page = 1;
				me.rows = parseInt($(this).val());
				me._setData();
			});
		},
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