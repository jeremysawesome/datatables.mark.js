/*!***************************************************
 * datatables.mark.js v2.1.0
 * https://github.com/julmot/datatables.mark.js
 * Copyright (c) 2016–2018, Julian Kühnel
 * Released under the MIT license https://git.io/voRZ7
 *****************************************************/

'use strict';

((factory, window, document) => {
  if (typeof exports === 'object') {
    const jquery = require('jquery');
    require('datatables.net');
    require('mark.js/dist/jquery.mark.js');
    module.exports = factory(window, document, jquery);
  } else if (typeof define === 'function' && define.amd) {
    define(['jquery', 'datatables.net', 'markjs'], jQuery => {
      return factory(window, document, jQuery);
    });
  } else {
    factory(window, document, jQuery);
  }
})((window, document, $) => {
  class MarkDataTables {
    constructor(dtInstance, options) {
      if (!$.fn.mark || !$.fn.unmark) {
        throw new Error('jquery.mark.js is necessary for datatables.mark.js');
      }
      this.instance = dtInstance;
      this.options = typeof options === 'object' ? options : {};
      this.intervalThreshold = 49;
      this.intervalMs = 300;
      this.initMarkListener();
    }

    initMarkListener() {
      const ev = 'draw.dt.dth column-visibility.dt.dth column-reorder.dt.dth';
      let intvl = null;
      this.instance.on(ev, () => {
        const rows = this.instance.rows({
          filter: 'applied',
          page: 'current'
        }).nodes().length;
        if (rows > this.intervalThreshold) {
          clearTimeout(intvl);
          intvl = setTimeout(() => {
            this.mark();
          }, this.intervalMs);
        } else {
          this.mark();
        }
      });
      this.instance.on('destroy', () => {
        this.instance.off(ev);
      });
      this.mark();
    }

    mark() {
      let searchPattern = this.instance.search(),
          searchRegex = this.instance.search.isRegex();
      $(this.instance.table().body()).unmark(this.options);
      this.instance.columns({
        search: 'applied',
        page: 'current'
      }).nodes().each((nodes, colIdx) => {
        const colSearch = this.instance.column(colIdx).search(),
              colRegex = this.instance.columns().search.isRegex().toArray()[colIdx];
        if (colSearch) {
          searchPattern = colSearch;
          searchRegex = colRegex;
        }
        if (searchPattern) {
          nodes.forEach(node => {
            if (!searchRegex) {
              $(node).mark(searchPattern, this.options);
            } else {
              $(node).markRegExp(searchPattern, this.options);
            }
          });
        }
      });
    }

  }

  $.fn.dataTable.Api.register('search.isRegex()', function () {
    const ctx = this.context;
    return ctx.length !== 0 ? ctx[0].oPreviousSearch.bRegex : false;
  });

  $.fn.dataTable.Api.registerPlural('columns().search.isRegex()', 'column().search.isRegex()', function () {
    return this.iterator('column', (settings, column) => {
      return settings.aoPreSearchCols[column].bRegex;
    });
  });

  $(document).on('init.dt.dth', (event, settings) => {
    if (event.namespace !== 'dt') {
      return;
    }

    const dtInstance = $.fn.dataTable.Api(settings);

    let options = null;
    if (dtInstance.init().mark) {
      options = dtInstance.init().mark;
    } else if ($.fn.dataTable.defaults.mark) {
      options = $.fn.dataTable.defaults.mark;
    }
    if (options === null) {
      return;
    }

    new MarkDataTables(dtInstance, options);
  });
}, window, document);
