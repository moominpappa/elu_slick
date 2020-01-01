(function ($) {
    
    (function(){

        $.blockUI.defaults.message = null
        $.blockUI.defaults.overlayCSS.opacity = 0.8
        $.blockUI.defaults.overlayCSS.backgroundColor = '#fff'

        let _do_apologize = $_DO.apologize
        $_DO.apologize = function (o, fail) {
            $('.blockUI').remove ()
            _do_apologize (o, fail)
        }

    })();
    
    $.extend (true, window, {
		Slick: {
		
			Formatters: {
			
		        "DDMMYYYY": function CheckmarkFormatter (row, cell, value, columnDef, dataContext) {
		        	if (value == null || value.length < 10) return ''
		        	value = value.slice (0, 10)
		        	if (value.charAt (2) == '.') return value
		        	return value.split ('-').reverse ().join ('.')
		        },
		        
			}
						
		}
		
    })
    
    $.fn.on_change = function (todo) {
    	this.each (function () {
    		let $this = $(this)
			let p = $this.parents ()
			let a = p [p.length - 1]
			todo.call (a, or_null ($this.val ()))
			$this.on ('change', function () {todo.call (a, or_null (this.value))})
    	})
    }

    $.fn.valid_data = function () {
	    return values (this).actual ().validated ()
    }
    
    $.fn.draw_popup = function (o = {}) {

    	if (this.is ('[noresize]')) o.resizable = false

    	let buttons = o.buttons || []

		$('>button', this).each (function () {

			let $this = $(this)

			if ($this.css ('display') == 'none') return

			let b = {text: $this.text (), attr: {}}
			
			let events = $._data (this, 'events')
			
			if (events) {
				for (let i of events.click) b.click = i.handler
			}
			else {
				darn (['No event handler is set for this button', this])
			}

			for (let a of this.attributes) {

				let k = a.name; if (k == 'style') continue
				let v = a.value
				
				switch (k) {
					case 'name':
						b.name = v
						break
					default: 
						b.attr [k] = v
				}
				
			}

			buttons.push (b)
			
			$(this).remove ()
		
		})
		
		o.buttons = buttons

    	if (!('modal' in o)) o.modal = true
    	for (let k of ['width', 'height']) if (!(k in o)) o [k] = this.attr (k)
    	    	
        let d = this.dialog (o).on ('dialogclose', (e) => {$(this).closest('.ui-dialog').remove (); blockEvent (e)})

    	$('.ui-dialog-titlebar button', d.parent ()).attr ({tabindex: -1})
    
    	return d

    }

    $.fn.draw_form = function (data) {

    	let _fields = data._fields; if (_fields) for (let _field of Object.values (_fields)) {

    		let v = data [_field.name]
    		
    		if (v instanceof Date) v = v.toJSON ()

    		if (v == null) v = ''; else v = '' + v
    	
    		switch (_field.TYPE_NAME) {
    			case 'DATE':
    				if (v.length > 10) v = v.slice (0, 10)
    			break
    		}
    		
    		data [_field.name] = v

    	}

        var $view = fill (this, data)
        
        let is_edit = (name) => {switch (name) {
            case 'update':
            case 'cancel':
                return true
            default:
                return false
        }}

        let is_visible = (name, is_ro) => {

            if (name == 'undelete') return data.is_deleted == 1

            if (data.is_deleted == 1) return false

            return is_ro ? !is_edit (name) : is_edit (name)

        }

        let read_only = {
        
            off: () => {

                $('button', $view).each (function () {
                    if (is_visible (this.name, 0)) $(this).show (); else $(this).hide ()
                })
                
                $(':input', $view).not ('button').each (function () {
                    $(this).prop ({disabled: 0})
                })

                $('*[autofocus]:visible', $view).focus ()
                
            },
            
            on: () => {

                $('button', $view).each (function () {
                    if (is_visible (this.name, 1)) $(this).show (); else $(this).hide ()
                })
                
                $(':input', $view).not ('button').each (function () {
                    $(this).prop ({disabled: 1})
                })
                
				clickOn ($('button[name=edit]', $view), read_only.off)
			
				clickOn ($('button[name=cancel]', $view), read_only.again)

            },

            again: (e) => {

                if (!confirm ('Отменить внесённые изменения?')) return

                refill (data, $(e.target).closest ('.drw.form'))

                read_only.on ()
                
            },

        }

        if ($('button[name=edit]', $view).length * $('button[name=cancel]', $view).length > 0) read_only.on ()

        return $view
        
    }
    
    $.fn.draw_table = function (o) {    
                    
        o = Object.assign ({
            enableCellNavigation: true,
            forceFitColumns: true, 
			autoEdit: false,
		}, o)
        
        for (let c of o.columns || []) if (c.filter) o.showHeaderRow = true
        if (o.showHeaderRow) o.explicitInitialization = true

        if (!o.searchInputs) o.searchInputs = []

        if (!o.rowHeight) {
			let $row = $('<div class=slick-row style="position:fixed;z-index:1000" />').prependTo (this)
			let h = $row.height (); if (h > 0) o.rowHeight = h
			$row.remove ()
        }
        
        if (!o.headerRowHeight) {
			let $row = $('<div class=slick-headerrow style="position:fixed;z-index:1000" />').prependTo (this)
			let h = $row.height (); if (h > 0) o.headerRowHeight = h
			$row.remove ()
        }

        if (this.height () == 0 && Array.isArray (o.data)) o.autoHeight = true

		if (o.src) {
			let src = Array.isArray (o.src) ? o.src : [o.src]
			let [type, part] = src [0].split ('.')
			o.url = {type, part, id: null}
			if (src.length > 1) o.postData = src [1]
		}

        let loader = !o.url ? null : new Slick.Data.RemoteModel (o.url, o.postData)

        if (loader) o.data = loader.data
        
        if (!o.data.getItemMetadata) o.data.getItemMetadata = o.getItemMetadata || function (row) {
            let r = o.data [row]
            if (r == null) return 
            if (r.is_deleted == 1) return {cssClasses: 'deleted'}
        }

		let plugins = []
		let selectionModel = null

		o.columns = (o.columns || []).map (c => {	
		
			if (c.class) c = new c.class (c)
		
			if (c.constructor.name == "CheckboxSelectColumn") {
			
				plugins.push (c)
				
				selectionModel = new Slick.RowSelectionModel ({selectActiveRow: false})
			
				return c.getColumnDefinition ()
			
			}
			else {
			
				if (!c.id) c.id = c.field

				if (c.voc) c.formatter = (r, _, v) => c.voc [v]
				
				return c
            
			}
		
		}) 

        let grid = new Slick.Grid (this, o.data, o.columns, o)
        
        this.data ('grid', grid)
        
		for (let plugin of plugins) grid.registerPlugin (plugin)
		
		if (selectionModel) grid.setSelectionModel (selectionModel)        
        
        if (o.showHeaderRow) {
        
            let f = o.onHeaderRowCellRendered || ((e, a) => {            
                let column = a.column
                let filter = column.filter                
                if (!filter) return $(a.node).text ('\xa0')
                if (!('title' in filter)) filter.title = column.name
                grid.setColFilter (a, filter)
            })
            
            o.onHeaderRowCellRendered = (e, a) => {

                f (e, a)

                if (!loader) return

                let col = a.column; if (!col.filter) return

                let $anode = $(a.node)

                $anode
                
                .mouseenter (() => {
                
	                let drop = $anode.data ('drop'); if (!drop) return

                    var s = loader.postData.search.filter (i => i.field == col.id)
                    
                    if (!s.length || s [0].value == null) return
                    
                    let $b = $('<div class=drop-filter>').appendTo ($anode).click ((e) => {
                        blockEvent (e)
                        grid.setFieldFilter ({field: col.id})
                        $b.remove ()
                        drop ()
                    })

                })
                
                .mouseleave (() => {
                    $('.drop-filter', $anode).remove ()
                })

            }
            
        }
        
        if (o.onRecordDblClick) {
        
        	o.onDblClick = (e, a) => o.onRecordDblClick (a.grid.getDataItem (a.row))
        
        }
        
        if (o.onCellChange) {
        
        	let todo = o.onCellChange
        	
        	o.onCellChange = async (e, a) => {
        
				let defaultValue = grid.getCellEditor ().defaultValue

				let field = grid.getColumns () [a.cell].field

				try {
					await todo (e, a)
				}
				catch (x) {
					Slick.GlobalEditorLock.cancelCurrentEdit ()
					grid.getData () [a.row] [field] = defaultValue
					grid.invalidateRow (a.row)
					grid.render ()
				}

			}
        
        }
        
        for (let i of [
            'onClick',
            'onDblClick',
            'onKeyDown',
            'onHeaderRowCellRendered',
            'onContextMenu',
            'onSelectedRowsChanged',
            'onCellChange',
        ]) {
        	let h = o [i]
        	if (h) grid [i].subscribe (h)
        }
        
        grid.refresh = () => grid.onViewportChanged.notify ()
        
        grid.reload = () => {
            loader.clear ()
            grid.setData (loader.data, true)
            grid.refresh ()
        }
        
        grid.findDataItem = (r) => {
        
        	let data = grid.getData ()

        	outer: for (let n in data) {
        	
        		if (isNaN (n)) continue

        		let v = data [n]

        		for (let k in r) {
        			let s = r [k]
        			if (typeof s == "function") continue         		
        			if (s != v [k]) continue outer
        		}
        		
        		return v
        		
        	}
        	
        	return {}

        }        
        
        if (loader) {
        
        	grid.each = loader.each
        
            grid.loader = loader
            
            grid.toSearch = function ($input) {
            
                function op (tag) {switch (tag) {
                    case 'INPUT': return 'contains'
                    default: return 'is'
                }}
                
                function val () {
                    let v = $input.val ()
                    if (v === '') return null
                    return v
                }
            
                return {
                    field: $input.attr ('data-field') || $input.attr ('name'), 
                    value: val (),
                    operator: $input.attr ('data-op') || op ($input.get (0).tagName),
                }
                
            }                
            
            for (let i of o.searchInputs) {
                let $i = $(i)
                let tag = $i.get (0).tagName
                if (tag == 'BUTTON') continue
                loader.setSearch (grid.toSearch ($i))
                switch (tag) {
                    case 'INPUT':
                        $i.keyup ((e) => {if (e.which == 13) grid.setFieldFilter (grid.toSearch ($i))})
                        break
                    case 'SELECT':
                        $i.selectmenu ({
                            width: true,
                            change: () => {grid.setFieldFilter (grid.toSearch ($i))}
                        })
                        break
                }
            }

            grid.setFieldFilter = (s) => {
                grid.loader.setSearch (s)
                grid.reload ()
            }
            
            grid.setColFilter = (a, filter) => {            
            	show_block ('_grid_filter_' + filter.type, {a, filter})            	            
            }

            loader.onDataLoaded.subscribe ((e, args) => {
                for (var i = args.from; i <= args.to; i ++) grid.invalidateRow (i)
                grid.updateRowCount ()
                grid.render ()
                if (grid.getOptions ().enableCellNavigation && grid.getActiveCell () == null) {
                	grid.setActiveCell (0, 0)
                	grid.focus ()
                }
                this.unblock ()
            })        
            
            grid.onViewportChanged.subscribe (function (e, args) {
                var vp = grid.getViewport ()
                loader.ensureData (vp.top, vp.bottom)
            })

            grid.onSort.subscribe (function (e, args) {
                loader.setSort (args.sortCol.field, args.sortAsc ? 1 : -1)
                grid.reload ()
            })
            
			grid.onKeyDown.subscribe (function (e, args) {
				if (e.which == 13 && !e.ctrlKey && !e.altKey && grid.getActiveCell ()) grid.onDblClick.notify (args, e, this)
			})

        }
        else {

			grid.each = async function (cb) {
			
				let data = grid.data

				for (let i = 0; i < data.length; i ++) cb.call (data [i], i)

			}        
        
        }
        
		grid.saveAsXLS = async function (fn, cb) {
		
			let cols = grid.getColumns ()

			let html = '<html><head><meta charset=utf-8><style>td{mso-number-format:"\@"} td.n{mso-number-format:General}</style></head><body><table border>'

			html += '<tr>'
			for (let col of cols) html += '<th>' + col.name
			html += '</tr>'
						
			await grid.each (function (row) {

				html += '<tr>'
				
				for (let cell = 0; cell < cols.length; cell ++) {
				
					let columnDef = cols [cell]

					html += '<td>'

					let value = this [columnDef.field]
					
					let formatter = columnDef.formatter; if (formatter) {
					
						value = formatter (row, cell, value, columnDef, this)

						if (typeof value === 'object' && 'text' in value) value = value.text
						
					}

					if (value != null) html += value

				}

				if (cb) cb (row)

			})
			
			html += '</table></body></html>'

			html.saveAs (fn)
		
		}
                
        $(window).on ('resize', function (e) {grid.resizeCanvas ()})
                
        this.data ('grid', grid)
        
        if (o.explicitInitialization) grid.init ()
        
        setTimeout (() => {
        	grid.resizeCanvas ()
        	grid.refresh ()
        }, 0)

        return grid

    }

    function RemoteModel (tia, postData) {
    
        if (!postData) postData = {}
        postData.searchLogic = 'AND'
        if (!postData.search) postData.search = []
        if (!postData.limit)  postData.limit = 50 
                
        var data = {length: 0}
        var in_progress = {}
        var sortcol = null
        var sortdir = 1
        
        var onDataLoading = new Slick.Event ()
        var onDataLoaded  = new Slick.Event ()

        function init () {}

        function clear () {
            for (k in data) if (k != 'getItemMetadata') delete data [k]
            data.length = 0
        }
        
        async function each (cb) {
			
			for (let i = 0, from = 0, len = data.length; from < len; from += postData.limit) {
			
				let {all, cnt} = await select_all_cnt (from)
				
				for (let one of all) cb.call (one, i ++)
				
			}
			
        }        
        
        function to_all_cnt (data) {
        
        	let all_cnt = {}
        	
        	for (let k in data) 
        		if (k != 'portion') 
        			all_cnt 
        				[k == 'cnt' ? 'cnt' : 'all'] 
        					= data [k]
        	
			return all_cnt
        
        }

        async function select_all_cnt (from) {

			let pd = clone (postData)
			
			pd.offset = from
			
			return to_all_cnt (await response (tia, pd))
                
        }
        
        async function ensurePage (p) {

			if (in_progress [p]) return

			let portion = postData.limit

			let from = p * portion
			
			if (data [from]) return
			
			let e = {from, to: from + portion - 1}
			
            onDataLoading.notify (e)
            
            	in_progress [p] = 1
            	
            		let {all, cnt} = await select_all_cnt (from)

					let len = all.length

					data.length = parseInt (cnt) || len

					for (var i = 0; i < len; i ++) data [from + i] = all [i]
				
				delete in_progress [p]

            onDataLoaded.notify (e)
        
        }
        
        function ensureData (from, to) {

            if (!(from >= 0)) from = 0

            let len = data.length; if (len > 0 && to >= len) to = len - 1
            
            let [p_from, p_to] = [from, to].map (n => Math.floor (n / postData.limit))

            for (let p = p_from; p <= p_to; p ++) ensurePage (p)
            		
        }

        function reloadData (from, to) {
        
            for (var i = from; i <= to; i ++) delete data [i]
            
            ensureData (from, to);
            
        }

        function setSort (field, dir) {

            if (field) {
                postData.sort = [{field: field, direction: dir > 0 ? 'asc' : 'desc'}]
            }
            else {
                delete postData.sort
            }

            clear ()

        }

        function setSearch (s) {
        
            function apply (term) {
                if (s == null) return []
                let a = postData.search.filter ((i) => i.field != s.field)
                if (s.value != null) a.push (s)
                return a
            }
        
            postData.search = apply (s)            
            clear ()
            
        }
        
        init ()

        return {

          each,
          data,
          postData,

          clear,
          ensureData,
          reloadData,
          setSort,
          setSearch,

          onDataLoading,
          onDataLoaded,

        }
    
    }

    $.extend (true, window, {Slick: {Data: {RemoteModel: RemoteModel}}})

})(jQuery);

(function ($) {

  function handleKeydownLRNav(e) {
    var cursorPosition = this.selectionStart;
    var textLength = this.value.length;
    if ((e.keyCode === $.ui.keyCode.LEFT && cursorPosition > 0) ||
         e.keyCode === $.ui.keyCode.RIGHT && cursorPosition < textLength-1) {
      e.stopImmediatePropagation();
    }
  }

  function handleKeydownLRNoNav(e) {
    if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT) {	
      e.stopImmediatePropagation();	
    }	
  }

  function Input (args) {

    var $input
    var defaultValue
    
    this.init = function () {
    
	    let col = args.column
	    
	    this.field = col.field

	    let attr = Object.assign ({type: 'text'}, (col.input || {}))
	    
	    this.type = attr.type
	    
		$input = $("<input />")
			.attr (attr)
          	.appendTo (args.container)
          	.on ("keydown.nav", args.grid.getOptions ().editorCellNavOnLRKeys ? handleKeydownLRNav : handleKeydownLRNoNav)
          	.focus ()
          	.select ()
          	                    	
    }

    this.destroy = function () {
		$input.remove ()	
    }

    this.focus = function () {
		$input.focus ()
    }
    
    this.canonize = function (v) {

    	if (v == null) return ''
    	
    	switch (this.type) {
    		case 'date' : return v.slice (0, 10)
    		default     : return v
    	}
    	
    }

    this.loadValue = function (item) {    
    	let v = this.canonize (item [this.field])
    	if (defaultValue == null) defaultValue = this.defaultValue = $input [0].defaultValue = v
		$input.val (v).select ()
    }

    this.serializeValue = function () {
    	let v = $input.val ()
    	if (v == '') return null
    	return v
    }

    this.applyValue = function (item, v) {
		item [this.field] = v
    }

    this.isValueChanged = function () {
		return $input.val () != defaultValue
    }

    this.validate = function () {

    	let v = args.column.validator

    	return v ? v ($input.val ()) : {valid: true, msg: null}

    }

	this.init ()
		
  }
  
  function Select (args) {

    var $input
    var defaultValue
    
    this.init = function () {
    
	    let col = args.column

	    this.field = col.field
	    	    
		$input = $("<select />").appendTo (args.container)
          	
        if (col.empty) $('<option value="" />').text (col.empty).appendTo ($input)
        if (col.voc) for (let i of col.voc.items) $('<option/>').attr ({value: i.id}).text (i.label).appendTo ($input)
        
        $input.change (() => args.grid.getEditorLock ().commitCurrentEdit ())
          	          	
    }

    this.destroy = function () {
		$input.remove ()	
    }

    this.focus = function () {
		$input.focus ()
    }
    
    this.canonize = function (v) {
    	if (v == null) return ''
		return v
    }

    this.loadValue = function (item) {    
    	let v = this.canonize (item [this.field])
    	if (defaultValue == null) defaultValue = this.defaultValue = $input [0].defaultValue = v
		$input.val (v).select ()
    }

    this.serializeValue = function () {
    	let v = $input.val ()
    	if (v == '') return null
    	return v
    }

    this.applyValue = function (item, v) {
		item [this.field] = v
    }

    this.isValueChanged = function () {
		return $input.val () != defaultValue
    }

    this.validate = function () {
    	let v = args.column.validator
    	return v ? v ($input.val ()) : {valid: true, msg: null}
    }

	this.init ()
		
  }

  $.extend (true, window, {Slick: {Editors: {Input, Select}}})  

})(jQuery)

function add_vocabularies (data, o) {

    for (var name in o) {

        var raw = data [name]; if (!raw) continue

        var idx = {items: raw.filter (function (r) {var f = r.fake; return !f || parseInt (f) == 0})}; $.each (raw, function () {idx [this.id] = this.text = this.label})

        data [name] = idx

    }

}

async function draw_form (name, data) {

	return (await use.jq (name)).draw_form (data)
	
}

async function draw_popup (name, data, o = {}) {

	if (!('dialogClass' in o)) o.dialogClass = name

	return (await draw_form (name, data)).draw_popup (o)
	
}

function get_popup () {

    return $('body .ui-dialog:last .ui-dialog-content')
	
}

function close_popup () {

    let $this = get_popup ()

    $this.dialog ('close')

    $this.remove ()
    
}

////////////////////////////////////////////////////////////////////////////////

$_GET._grid_filter_text = $_GET._grid_filter_checkboxes = async function (data) {

	return data

}

////////////////////////////////////////////////////////////////////////////////

$_DRAW._grid_filter_text = async function (data) {

	let a = data.a
	let o = data.filter || {}
	
    let $ns = $('<input class=ui-widget>')
    
    $ns.attr ({
        'data-field': a.column.id,
        placeholder: o.title || a.column.name,
    })
    
    $ns.appendTo ($(a.node))
    
    $ns.change (() => {a.grid.setFieldFilter (a.grid.toSearch ($ns))})

    $(a.node).data ('drop', () => {$ns.val ('')})

}

////////////////////////////////////////////////////////////////////////////////

$_GET._grid_filter_checkboxes = async function (data) {

	let a = data.a
	let grid = a.grid
	let o = data.filter || {}
	if (!o.items && a.column.voc) o.items = a.column.voc.items

	data.get_ids = function () {
	
		let loader = grid.loader; if (!loader || !loader.postData || !loader.postData.search) return null

		for (let search of loader.postData.search) 
			if (search.field == a.column.id) 
				return search.value

	}                 

	data.set_ids = function (ids) {

		$(a.node).text (data.label (ids))

		grid.setFieldFilter ({
			field:    a.column.id, 
			operator: 'in',
			value:    ids, 
		})

	}
	
	return data

}

////////////////////////////////////////////////////////////////////////////////

$_DRAW._grid_filter_checkboxes = async function (data) {

	let o = data.filter
	let a = data.a
	let grid = a.grid
	
	let name = a.column.id

	let $anode = $(a.node)

	data.label = function (ids) {
		if (!ids || !ids.length) return '[не важно]'
		return ids.map (id => o.items.filter (it => it.id == id) [0].label).join (', ')
	}                 
	
	$anode
		.text  (data.label (data.get_ids ()))
		.click (() => show_block ('_grid_filter_checkboxes_popup', data))
		.data  ('drop', () => {$anode.text (data.label (null))})

}

////////////////////////////////////////////////////////////////////////////////

$_DO.set_all__grid_filter_checkboxes_popup = async function (e) {

	let grid = $("#grid_options").data ('grid')

	grid.setSelectedRows (Array.from (Array (grid.getData ().length).keys ()))

}

////////////////////////////////////////////////////////////////////////////////

$_DO.clear_all__grid_filter_checkboxes_popup = async function (e) {

	$("#grid_options").data ('grid').setSelectedRows ([])

}

////////////////////////////////////////////////////////////////////////////////

$_DO.update__grid_filter_checkboxes_popup = async function (e) {

	let grid = $("#grid_options").data ('grid')

	let ids = grid.getSelectedRows ().map (i => grid.getDataItem (i).id)

	if (!ids.length) ids = null

	get_popup ().data ('data').set_ids (ids)

	close_popup ()

}

////////////////////////////////////////////////////////////////////////////////

$_GET._grid_filter_checkboxes_popup = async function (data) {

	delete data._can

	return data

}

////////////////////////////////////////////////////////////////////////////////

$_DRAW._grid_filter_checkboxes_popup = async function (o) {

	let filter = o.filter

    let $view = $(`
    
		<span class="drw popup-form">

			<style>

				#grid_options {
					border: solid #ccc 1px;
					width: 100%;
				}

				#grid_options input[type=checkbox] {
					height: 13px;
					width: 13px;
				}

			</style>

			<div id="grid_options" class="drw table" />

			<button name=set_all>Все</button>
			<button name=clear_all>Очистить</button>
			<button name=update>Установить</button>

		</span>

	`)

	$('button', $view).attr ({'data-block-name': '_grid_filter_checkboxes_popup'})

	$view.data ('data', o)
	$view.setup_buttons ()

	$view.draw_popup ({
		title: filter.title,
		width: 400,
		maxHeight: filter.maxHeight || 400,
	})

	let data = filter.items
			
    let grid = $("#grid_options", $view).draw_table ({

        enableCellNavigation: false,

        columns: [
			{
				hideInColumnTitleRow: true,
				class: Slick.CheckboxSelectColumn,
			},
            {	
            	field: "label", 
            },
        ],
        
        data: filter.items

    })
    
    let $c = $(grid.getCanvasNode ())

    let $p = $c.parent ().parent ().parent ().parent ()

    if ($c.height () > $p.height ()) {

    	grid.setOptions ({autoHeight: false})

    	$("#grid_options", $view).height ($p.height () - 10)

    	grid.resizeCanvas ()    

    }

  	let ids = o.get_ids (); if (ids && ids.length > 0) {

		let idx  = {}; for (let id of o.get_ids () || []) idx [id] = 1

		let rows = []; for (let i = 0; i < data.length; i ++) if (idx [data [i].id]) rows.push (i)

		grid.setSelectedRows (rows)

  	}

}