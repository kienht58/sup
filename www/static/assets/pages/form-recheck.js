/**
* Theme: Ubold Admin Template
* Author: Coderthemes
* Component: Editable
*
*/

(function( $ ) {

    'use strict';
    var EditableTable = {

        options: {
            searchButton: '#search',
            table: '#datatable-editable',
            dialog: {
                wrapper: '#dialog',
                cancelButton: '#dialogCancel',
                confirmButton: '#dialogConfirm',
            }
        },

        initialize: function() {
            this
                .setVars()
                .build()
                .events();
        },

        setVars: function() {
            this.$table             = $( this.options.table );
            this.$searchButton      = $( this.options.searchButton );
            // dialog
            this.dialog             = {};
            this.dialog.$wrapper    = $( this.options.dialog.wrapper );
            this.dialog.$cancel     = $( this.options.dialog.cancelButton );
            this.dialog.$confirm    = $( this.options.dialog.confirmButton );

            return this;
        },

        build: function() {
            var time = new Date();
            var day = time.getDate();
            var month = time.getMonth() + 1;
            var year = time.getFullYear();
            var today = day + '/' + month + '/' + year;
            this.datatable = this.$table.DataTable({
                aoColumns: [
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    // { "bSortable": false }
                ],
                "columnDefs": [
                    { className: "printable", "targets": [ 0, 1, 2, 3, 4, 5, 6 ] }
                ],
                "pageLength": 10,
                searching: false,
                dom: "Bfrtip",
                buttons: [{
                    extend: "excel",
                    className: "btn-sm",
                    title: "Danh sách vận chuyển" + today,
                    exportOptions: {
                        columns: ".printable",
                        format: {
                            body: function ( data, column, row ) {
                                return data.replace( /<br\s*\/?>/ig, "\n" )
                            }
                        }
                    }
                }, {
                    extend: "print",
                    className: "btn-sm",
                    title: "Danh sách vận chuyển " + today,
                    exportOptions: {
                        format: {
                            body: function ( data, column, row ) {
                                return data.replace( /<br\s*\/?>/ig, "\n" )
                            }
                        },
                        columns: ".printable",
                    }
                }],
                responsive: !0,
                processing: true,
                serverSide: true,
                ajax: {
                    url: "/get-transport-list",
                    data: function (d) {
                        d.origins = $('#from').val();
                        d.destinations = $('#destination').val();
                        d.ship_methods = $('#ship_method').val();
                        d.transport_state = $('#transport_state :selected').val();
                        d.date_start = $('input[name=date-start]').val();
                        d.date_end = $('input[name=date-end]').val();
                    },
                }
            });

            window.dt = this.datatable;

            return this;
        },

        events: function() {
            var _self = this;
            var l = this.$searchButton.ladda();
            this.$searchButton.on( 'click', function(e) {
                l.ladda('start');
                _self.datatable.draw();
                l.ladda('stop');
                e.preventDefault();
            });
            return this;
        },

    };

    $(function() {
        EditableTable.initialize();
    });

}).apply( this, [ jQuery ]);