(function($) {

  // ===========================================
  // = thought shop html5 table editing widget =
  // ===========================================	
  $.widget("ui.tsEditableTable", {
    // default options
    options: {
      
    },

    _create: function() {
      var self = this;

      self.element.addClass("ts-editable-table table-editable")

      // check external clicks
      $(document).mousedown(function(event){
        self._checkExternalClick(event);
      });

      self.active = false;
      self.element.attr('contentEditable', false);

      // enable editing on click
      self.element.bind('click', function() { self.edit() })

    },

    edit: function() {
      var self = this;

      if ( self.active ) { return false; }

      self.active = true;

      self.element.delegate('td, th', 'click', function(e) {
        if ( $(e.target).is('td,th') ) {
          self._clearCellSelection();
        }
      })
      self.element.delegate('tr.select-column td', 'click', function(e) {
        if ( $(e.target).is('td') ) {
          self._clearCellSelection();
          self._selectColumn( $(this) );
        }
      })
      self.element.delegate('td.select-row', 'click', function(e) {
        if ( $(e.target).is('td.select-row,.btn') ) {
          self._clearCellSelection();
          self._selectRow( $(this) );
        }
      })

      self.element.find('td,th').attr('contentEditable', true)

      self._addEditCells()

    },

    done: function() {
      var self = this;
      self.active = false;
      self._reset();
    },

    _reset: function() {
      var self = this;

      // remove editing cells
      self.element.find('.select-row, .select-column').remove();

      // unbind clicks
      self.element.undelegate('td', 'click');
      self.element.undelegate('tr.select-column td', 'click');
      self.element.undelegate('td.select-row', 'click');

      // clear selections
      self._clearCellSelection();

      // disable content editable
      self.element.find('td,th').attr('contentEditable', false);

    },

    addColumn: function(afterIndex) {
      var self = this;

      self.element.find('thead tr.select-column td').eq(afterIndex).after(self._columnSelectCell());
      self.element.find('thead tr:not(.select-column)').each(function(){
        $(this).children().eq(afterIndex).after(self._cell('th'));
      });
      self.element.find('tbody tr').each(function(){
        $(this).children().eq(afterIndex).after(self._cell());
      });
      self._clearCellSelection();
    },

    removeColumn: function(e) {
      var self = this;

      if (self._lastColumn()) { return false; }

      var cell = $(e.currentTarget).closest('td')
      self._clearCellSelection();
      self._selectColumn( $(cell) );
      self.element.find('.selected').remove();
      self._clearCellSelection();
    },

    addRow: function(after) {
      var self = this;

      if (!after) { after = self.find('tr').last() }
      if (after.closest('thead').length > 0) { after = null }

      var row = $('<tr/>');
      row.append(self._rowSelectCell());
      for (i=0;i<self._columns();i++) {
        row.append(self._cell());
      }

      if (after == null) {
        self.element.find('tbody').prepend(row);
      } else {
        after.after(row);
      }
      self._clearCellSelection();
    },

    removeRow: function(e) {
      var self = this;

      if (self._lastRow()) { return false; }

      var row = $(e.currentTarget).closest('tr');
      $(row).remove();
    },

    _addEditCells: function() {
      var self = this;

      // add top row for selecting columns
      var top_row = $('<tr/>', {
        class: 'select-column',
        contentEditable: false
      })
      for (i=0;i<self._columns();i++) {
        top_row.append(self._columnSelectCell());
      }
      self.element.find('thead').prepend(top_row);

      // add left column for selecting rows
      var first = true;
      self.element.find('tr').each(function(){
        if (first) {
          $(this).prepend(self._cornerCell());
          first = false;
        } else {
          $(this).prepend(self._rowSelectCell());
        }
      });

    },

    _columns: function() {
      var self = this;
      return self.element.find('tr').last().children('td:not(.select-row)').length;
    },

    _rows: function() {
      var self = this;
      return self.element.find('tr').length;
    },

    _cell: function(type) {
      if (!type) { type = "td" }
      return $('<'+type+'/>', {
        contenteditable: true
      })
    },
    
    _columnSelectCell: function() {
      var self = this;

      return $('<td/>', {
        contentEditable: false
      }).append(self._tableEditDropdown("column"));
    },

    _rowSelectCell: function() {
      var self = this;

      return $('<td/>', {
        class: "select-row",
        contentEditable: false
      }).append(self._tableEditDropdown("row"));
    },

    _cornerCell: function() {
      var self = this;

      return $('<td/>', {
        contentEditable: false
      }).append(self._tableEditDropdown("corner"));
    },
    
    _tableEditDropdown: function(type) {
      var self = this;

      var cell_content = $('<div/>', {
        class: "pull-right"
      });

      var btn_group = $('<div/>', {
        class: "btn-group",
        html: '<a class="btn dropdown-toggle ts-editable-link" data-toggle="dropdown" href="#"><span class="caret"></span></a>'
      }).appendTo(cell_content);

      var dropdown = $('<ul/>', {
        class: "dropdown-menu"
      }).appendTo(btn_group);

      if (type == "corner") {
        var remove_table = $('<a/>', {
          class: "ts-editable-link",
          href: "#",
          text: "Delete Table",
          click: function(e) { self._removeTable(); }
        }).appendTo(dropdown).wrap('<li/>');
      }
      if (type == "column") {
        var add_column = $('<a/>', {
          class: "ts-editable-link",
          href: "#add_column",
          text: "Add Column",
          click: function(e) { self.addColumn( self._columnIndex( $(this).closest('td')) ) }
        }).appendTo(dropdown).wrap('<li/>');

        var remove_column = $('<a/>', {
          class: "ts-editable-link",
          href: "#remove_column",
          text: "Remove Column",
          click: function(e) { self.removeColumn(e) }
        }).appendTo(dropdown).wrap('<li/>');
      }

      if (type == "row") {
        var add_row = $('<a/>', {
          class: "ts-editable-link",
          href: "#add_row",
          text: "Add Row",
          click: function(e) { self.addRow( $(this).closest('tr') ) }
        }).appendTo(dropdown).wrap('<li/>');

        var remove_column = $('<a/>', {
          class: "ts-editable-link",
          href: "#remove_row",
          text: "Remove Row",
          click: function(e) { self.removeRow(e) }
        }).appendTo(dropdown).wrap('<li/>');
      }

      return cell_content;
    },

    _columnIndex: function( $cell ) {
      var self = this;

      return $cell.parent().children().index( $cell );
    },

    _selectColumn: function($cell) {
      var self = this;

      // var index = $cell.parent().find('td').index($cell);
      self.element.find('tr').each(function(){
        $(this).find('td,th').eq( self._columnIndex($cell) ).addClass("selected")
      });
    },

    _selectRow: function($cell) {
      var self = this;

      $cell.parent().find('td,th').addClass("selected")
    },

    _clearCellSelection: function() {
      var self = this;
      self.element.find('th,td').removeClass("selected")
    },

    _lastRow: function() {
      var self = this;

      if (self.element.find('tr').length > 2) {
        return false;
      }
      return true;
    },

    _lastColumn: function() {
      var self = this;

      if (self.element.find('tr').first().children().length > 2) {
        return false;
      }
      return true;
    },

    _checkExternalClick: function(event) {
      var self = this;

      if (self.active) {
        var el = self.element;

        var $target = $(event.target);
        if ($target[0] != el &&
            $target[0].id != "#ts-editable-toolbox" &&
            $target.parents('.ts-editable-table').length == 0 &&
            $target.parents("#ts-editable-toolbox").length == 0) {
          self.done();
          return false;
        }
      }
    },

    _removeTable: function(event) {
      var self = this;

      if (confirm("Are you sure you want to delete the entire table?")) {
        self.element.remove();
        self.destroy();
      }
    },

    destroy: function() {
      var self = this;
      self.done();
      self.element.unbind('click');

      $.Widget.prototype.destroy.apply(this, arguments); // default destroy
      // now do other stuff particular to this widget
    }
  });

})(jQuery);
