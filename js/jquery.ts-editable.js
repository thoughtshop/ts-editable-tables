(function($) {

  // ===========================================
  // = thought shop html5 edit-in-place widget =
  // ===========================================	
  $.widget("ui.tsEditable", {
    // default options
    options: {
      controls : "h1,h2,h3,h4,b,i,li,a,btn,red,grey,table,raw",
      raw: false,
      placeholder_text: "Click to edit...",
      table_editing: true,
      table_editing_options: { },
      save : function($editable, self, content) {

      }
    },

    _create: function() {
      var self = this;
      self.element.addClass("editable");
      self._addPlaceholder();
      self._bindClick();
    },

    _bindPaste: function(){
      var self = this;

      self.element.bind('paste',function(e){
        var prevTxt = self._saveSelection();

        var prompt = $('<div id="prompt" class="dialog dialog_paste">')
        .append('<textarea id="paste_here">')
        .appendTo("body")
        .dialog({
          modal: true,
          closeOnEscape: false,
          resizable: false,
          width: 500,
          title: "Paste your text here:",
          open: function(){
            $('#paste_here').focus();
          },
          buttons: {
            Paste: function() {
              var pastedTxt = $('#paste_here').val();
              $(this).dialog( "destroy" ).remove();
              self._restoreSelection(prevTxt);
              self._insertTextAtCursor(pastedTxt);
              self.element.effect("highlight");
            }
          }
        });          
        return false;
      });
    },

    _bindClick: function(){
      var self = this;
      self.element.click(function(){
        if ( $('.editing').length == 0 ) {					
          self._startEditing();					
        } else {
          if ( self.element.hasClass('editing') != true ) { $('.editing').effect("highlight"); }
        }
      });
    },	


    // Internal Functions

    _addPlaceholder: function() {
      var self = this;
      if ( self.element.text().trim().length == 0 ) {
        self.element.data('placeholder', self.options.placeholder_text);
        self.element.html(self.options.placeholder_text);
      }
    },

    _insertTextAtCursor: function(text) {
      var self = this;
      var sel, range;
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode( document.createTextNode(text) );
      }
    },

    _selectionLength: function() {
      sel = window.getSelection();
      // sel = sel.text;
      sel = sel.getRangeAt(0);
      return sel.toString().length;
    },

    _saveSelection: function() {
      var self = this;

      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        return sel.getRangeAt(0);
      }

      return null;
    },

    _restoreSelection: function(range) {
      var self = this;
      if (range) {
        sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    },

    _clearSelection: function() {
      sel = window.getSelection();
      sel.removeAllRanges();
    },

    _getSelectionContainerElement: function () {
      var sel = window.getSelection(), el = null;
      if (sel.rangeCount) {
        var range = sel.getRangeAt(0);
        el = range.commonAncestorContainer;
        if (el.nodeType != 1) {
          el = el.parentNode;
        }
      }
      return el;
    },

    _ts_editable_cancel: function() {
      var self = this;

      self._stopEditing();
      self.element.html( self.element.data('prevTxt') );
    },

    _ts_editable_save: function() {
      var self = this;

      self._stopEditing();

      if (!self.options.raw) {
        var content = self.element.html();
      } else {
        var content = self.element.find('textarea').val();
        self.element.html( content );
      }

      if ( self.element.html() == self.element.data('placeholder') ) {
        self._ts_editable_cancel();
      } else {
        self.options.save(self.element, self, content);
      }

    },

    _createLink: function(button){
      var self = this;

      //check if text is selected
      if (self._selectionLength() == 0) {
        notify("Please select some text to create a link or button.");
        return false;
      }

      var selection = self._saveSelection();

      var dialog = $('<div id="_ts_editable_link_dialog" class="dialog">')
      .append('<input id="link_url" value="http://">')
      .appendTo("body")
      .dialog({
        modal: true,
        closeOnEscape: false,
        resizable: false,
        width: 500,
        title: "Enter Link Url",
        open: function(){
          $('#link_url').focus();
        },
        buttons: {
          "Remove Link": function() {
            $(this).dialog( "destroy" ).remove();
            self._restoreSelection(selection);
            document.execCommand('unlink',false,null);
          },
          "Add Link": function() {
            var url = $('#link_url').val();
            $(this).dialog( "destroy" ).remove();
            self._restoreSelection(selection);
            document.execCommand('unlink',false,null);
            document.execCommand('createLink',false,url);

            if ( button && button == true ) {
              self._getSelectionContainerElement().setAttribute("class", "btn");	
            }

            self._bindLinkEditing();
            self._clearSelection();
            self.element.effect("highlight");
          }
        }
      });
    },

    _editRaw: function(){
      var self = this;

      var dialog = $('<div id="ts_editable_raw_dialog" class="dialog">')
      .append('<textarea id="ts_editable_raw">'+ self.element.html() +'</textarea>')
      .appendTo("body")
      .dialog({
        modal: true,
        closeOnEscape: false,
        resizable: false,
        width: 500,
        title: "Edit Raw HTML",
        open: function(){
          $('#ts_editable_raw').focus();
        },
        buttons: {
          "Update": function() {
            var raw_content = $('#ts_editable_raw').val();
            $(this).dialog( "destroy" ).remove();
            self.element.html( raw_content );
            self.element.effect("highlight");
          }
        }
      });

    },

    _editLink: function($link) {
      var self = this;

      var dialog = $('<div id="_ts_editable_link_dialog" class="dialog">')
      .append('<input id="link_url" value="'+ $link.attr('href') +'">')
      .appendTo("body")
      .dialog({
        modal: true,
        closeOnEscape: false,
        resizable: false,
        width: 500,
        title: "Edit Link Url",
        open: function(){
          $('#link_url').focus();
        },
        buttons: {
          "Remove Link": function() {
            $(this).dialog( "destroy" ).remove();
            var text = $link.html();
            $link.replaceWith(text);
          },
          "Update Link": function() {
            var url = $('#link_url').val();
            $(this).dialog( "destroy" ).remove();
            $link.attr('href',url);
            self.element.effect("highlight");
          }
        }
      });
    },

    _insertTable: function() {
      var self = this;
      
      var parent = window.getSelection().anchorNode.parentNode; 
      if ( $(parent).parents('table').length > 0 ) { return false }

      var table = $('<table/>', {
        class: "table table-bordered"
      });
      var thead = $('<thead/>');
      var heading_row = $('<tr/>').appendTo(thead);
      var heading = $('<th/>').appendTo(heading_row).clone().appendTo(heading_row).clone().appendTo(heading_row);
      var tbody = $('<tbody/>')
      var row = $('<tr/>')
      var cell = $('<td/>').appendTo(row).clone().appendTo(row).clone().appendTo(row);

      thead.appendTo(table);
      row.appendTo(tbody).clone().appendTo(tbody);
      tbody.appendTo(table);

      var sel, range;
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode( table[0] );
      }

      table.tsEditableTable()

    },

    _bindLinkEditing: function() {
      var self = this;
      self.element.undelegate('a','click');
      self.element.delegate('a:not(.ts-editable-link)','click',function(){
        self._editLink($(this));
      });
    },

    _escapeKey: function(e) {
      var self = this;

      if (e.keyCode == 27) { 	// esc key
        if ( $('.ui-dialog').is(":visible") ) {
          $(".ui-dialog").each(function(){
            var id = $(this).attr("aria-labelledby").replace('ui-dialog-title-','');
            $("#"+id).dialog("close").remove();
          });
        } else if ( $('#ts-editable-toolbox').is(":visible") ) {
          $('#ts-editable-toolbox .ts-editable-cancel').click(); 
        }
      }
    },

    _stopEditing: function() {
      var self = this;

      if (!self.options.raw) {				
        self.element.attr("contentEditable",false);
        self.element.undelegate('a','click');	
        self._clearSelection();
        self.element.unbind('paste');	
      } else {				
        self.element.siblings('.raw_html_original').val( self.element.html() );
        notify("You may need to refresh the page to see the changes you made to this Raw HTML section.");
      }

      if ( self.options.table_editing ) {
        self.element.find('table').tsEditableTable('destroy');
      }

      self.element.removeClass("editing");
      $("#ts-editable-toolbox").remove();
      $(document).unbind("keyup", self._escapeKey);
      $(window).unbind("scroll", self._keepToolBoxVisible);			
    },

    _startEditing: function() {
      var self = this;

      var prevTxt = self.element.html();
      self.element.data('prevTxt',prevTxt).addClass("editing");

      self._showToolbox();

      if ( !self.options.raw ) {
        self._html5Editing();
      } else {
        self._rawEditing();
      }

      $(document).keyup(self._escapeKey);
      $(window).scroll(self._keepToolBoxVisible);

      if ( self.element.html() == self.element.data('placeholder') ) {
        self.element.html("");
      }

      if ( self.options.table_editing ) {
        self.element.find('table').tsEditableTable( self.options.table_editing_options );
      }

    },

    _rawEditing: function() {
      var self = this;

      var textarea = $('<textarea>', {
        val: self.element.siblings('.raw_html_original').val(),
        rows: 10
      });

      self.element.html( textarea );

    },

    _html5Editing: function() {
      var self = this;

      self._bindPaste();
      self.element.attr('contentEditable',true);			
      self._bindLinkEditing();
    },

    _keepToolBoxVisible: function(){
      var $toolbox = $("#ts-editable-toolbox");
      var offset = $toolbox.data('top');
      if ( $(window).scrollTop() + 76 > offset ) {
        $toolbox.addClass("fixedscroll");
      } else {
        $toolbox.removeClass("fixedscroll");
      }
    },

    _showToolbox: function() {
      var self = this;
      var options = self.options;

      $("#ts-editable-toolbox").remove();
      var $toolbox = $('<div id="ts-editable-toolbox">');

      var controls = options.controls.split(',');
      for(var i=0; i<controls.length; i++) {
        if ( controls[i] == "h1" ) { $toolbox.append('<button class="ts-editable-h1" onclick="document.execCommand(\'FormatBlock\',false,\'h1\');">H1</button>'); }				
        if ( controls[i] == "h2" ) { $toolbox.append('<button class="ts-editable-h2" onclick="document.execCommand(\'FormatBlock\',false,\'h2\');">H2</button>'); }				
        if ( controls[i] == "h3" ) { $toolbox.append('<button class="ts-editable-h3" onclick="document.execCommand(\'FormatBlock\',false,\'h3\');">H3</button>'); }				
        if ( controls[i] == "h4" ) { $toolbox.append('<button class="ts-editable-h4" onclick="document.execCommand(\'FormatBlock\',false,\'h4\');">H4</button>'); }				
        if ( controls[i] == "b" ) { $toolbox.append('<button class="ts-editable-bold" onclick="document.execCommand(\'bold\',false,null);">Bold</button>'); }				
        if ( controls[i] == "i" ) { $toolbox.append('<button class="ts-editable-italic" onclick="document.execCommand(\'italic\',false,null);">Italic</button>'); }
        if ( controls[i] == "li" ) { $toolbox.append('<button class="ts-editable-list" onclick="document.execCommand(\'InsertUnorderedList\',false,null);">List</button>'); }
        if ( controls[i] == "a" ) { var link_button = $('<button class="ts-editable-link">Link</button>').bind('click',function(){ self._createLink(); }); $toolbox.append(link_button); }
        if ( controls[i] == "btn" ) { var link_button = $('<button class="ts-editable-link">Button</button>').bind('click',function(){ self._createLink(true); }); $toolbox.append(link_button); }
        if ( controls[i] == "red" ) { $toolbox.append('<button class="ts-editable-red" onclick="document.execCommand(\'forecolor\',false,\'#820024\');">Red</button>'); }
        if ( controls[i] == "grey" ) { $toolbox.append('<button class="ts-editable-grey" onclick="document.execCommand(\'forecolor\',false,\'#6A6C70\');">Grey</button>'); }
        if ( controls[i] == "table" ) { var table_button = $('<button class="ts-editable-add-table">Table</button>').bind('click',function(){ self._insertTable(); }); $toolbox.append(table_button); }
        if ( controls[i] == "raw" ) { var raw_button = $('<button class="ts-editable-raw">Source</button>').bind('click',function(){ self._editRaw(); }); $toolbox.append(raw_button); }
      }

      var save_button = $('<button class="ts-editable-save">Save</button>').bind('click',function(){ self._ts_editable_save(); $(this).addClass("loading"); });
      $toolbox.append(save_button);
      var cancel_button = $('<button class="ts-editable-cancel">Cancel</button>').bind('click',function(){ self._ts_editable_cancel(); });
      $toolbox.append(cancel_button);

      var pos = self.element.offset();
      var top = pos.top;
      var width = self.element.width();
      $toolbox.css('left',pos.left+"px");
      $toolbox.css('top',top+"px");
      $toolbox.css('min-width',width-12+"px");
      $toolbox.appendTo( 'body' );

      $toolbox.data('top',top);

    },


    destroy: function() {
      $.Widget.prototype.destroy.apply(this, arguments); // default destroy
      // now do other stuff particular to this widget
    }
  });

})(jQuery);
