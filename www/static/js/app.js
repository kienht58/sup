$(document).ready(function() {
   var notif = sessionStorage.getItem('notif');
   if(notif) {
       $.Notification.autoHideNotify('success', 'top center', notif, notif);
       sessionStorage.removeItem('notif');
   }
});

$('#datepicker1').datepicker();
$('#datepicker2').datepicker();

$('#clear-search').click(function(e) {
    $('input[name=customer_name]').val('');
    $('input[name=tracking_number]').val('');
    $('input[name=from_date]').val('');
    $('input[name=to_date]').val('');
    $('#search-form').submit();
});

var fileUpload = document.getElementById("excel-upload");
var fileData = [];

fileUpload.addEventListener("change", function() {
    var file = this.files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
        $('#upload-file').ladda();
        var data = e.target.result;
        var workbook = XLSX.read(data, { type: 'binary'});

        workbook.SheetNames.forEach(function(sheetName) {
            var row = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            row.forEach(function(elem) {
                var trackingNumber = elem['tracking no'];

                if(trackingNumber) {
                    fileData.push({
                        trackingNumber: trackingNumber,
                        quantity: elem['Quantity'] ? elem['Quantity'] : '',
                        customer: _getCustomerInfo(elem['Shipping Address']),
                        orderSize: elem['Size'] ? elem['Size'] : '',
                        orderDate: elem['Date orders'] ? _formatDate(elem['Date orders']) : '',
                        shop: elem['Shop'] ? elem['Shop'] : ''
                    })
                }
            })
        });

        // push to server
        $.ajax({
            type: 'POST',
            url: '/update',
            contentType: 'application/json',
            data: JSON.stringify(fileData),
            dataType: 'json',
            success: function(res) {
                if(res.code == 200) {
                    window.location.reload();
                } else {
                    swal({
                        title: "Có lỗi xảy ra!",
                        text: "Các mã track " + res.data.join(', ') + ' bị trùng.',
                        confirmButtonText: "Okay"
                    }, function() {
                        window.location.reload();
                    });
                }
            },
            error: function() {
                swal({
                    title: "Oops",
                    text: "Có lỗi xảy ra!",
                    confirmButtonText: "Okay"
                });
            }
        })
    };

    reader.onerror = function(ex) {
        console.log(ex);
    };

    reader.readAsBinaryString(file);
}, false);

function _getCustomerInfo(str) {
    [name, address, city, country] = str.split('\n');

    return name
}

function _formatDate(str) {
    [month, day, year] = str.split(/[ .:;,/]/);
    month = (month < 10) ? '0' + month : month;
    day = (day < 10) ? '0' + day : day;
    year = (year < 99) ? year : year.substring(2);

    console.log(str);
    console.log(day + '/' + month + '/' + year);

    return day + '/' + month + '/' + year
}


var datatable;

$(function () {
    $('input[name=customer_name]').val(getParameterByName('customer_name'));
    $('input[name=tracking_number]').val(getParameterByName('tracking_number'));
    $('input[name=from_date]').val(getParameterByName('from_date'));
    $('input[name=to_date]').val(getParameterByName('to_date'));
    $(".nav-pills li").removeClass('active');

    datatable = $("#datatables").DataTable({
        searching: false,
        serverSide: true,
        processing: true,
        displayLength: 1000,
        ajax: {
            url: '/datatables',
            data: function(d) {
                d.customer_name = $('input[name=customer_name]').val();
                d.tracking_number = $('input[name=tracking_number]').val();
                d.from_date = $('input[name=from_date]').val();
                d.to_date = $('input[name=to_date]').val();
            },
            beforeSend: function () {
                $(".nav-pills li").addClass('disabled');
            },
            complete: function () {
                $(".nav-pills li").removeClass('disabled');
            }
        },
        lengthMenu: [[10, 25, 50, 1000, -1], [10, 25, 50, 1000, "All"]],
        columns: [
            {'data': 'id'},
            {'data': 'customer_name'},
            {'data': 'tracking_number'},
            {'data': 'size'},
            {'data': 'quantity'},
            {'data': 'shop'},
            {'data': 'order_date'},
            {'data': 'note'},
            {'data': ''}
        ],
        columnDefs: [
            {
                targets: 2,
                render: function(data, type, row) {
                    return '' +
                        '<div>' +
                            '<span id="' + data + '">' + data + '</span>' + '&nbsp;&nbsp;' +
                            '<i class="md md-content-copy copy-track" data-track="' + data + '" data-id="' + row.id + '"></i>' + '&nbsp;&nbsp;' +
                            '<i class="md md-undo undo-track" data-track="' + data + '" data-id="' + row.id + '"></i>' +
                        '</div>'
                }
            },
            {
                targets: 6,
                render: function(data, type, row) {
                    var date = data.split(" ")[0].split('-');
                    return date[2] + '/' + date[1] + '/' + date[0] + " 00:00:00"
                }
            },
            {
                targets: -1,
                render: function(data, type, row) {
                    var tracking_number = row.tracking_number;
                    var customer = row.customer_name;
                    return '' +
                        '<a class="table-action-btn" title="Edit">' +
                            '<i ' +
                        '       class="fa fa-edit text-primary add-note" ' +
                        '       data-track="' + tracking_number + '"' +
                        '       data-customer="' + customer + '"' +
                        '       data-toggle="modal"' +
                        '       data-target="#myModal"' +
                        '       data-id="' + row.id + '"' +
                        '   >' +
                        '   </i>' +
                        '</a>'
                }
            }
        ],
        createdRow: function(row, data, index) {
            if(data.copied) {
                $(row).css('background-color', '#646167');
                $(row).css('color', '#fff');
            }
        }
    });
});

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

$(document).on('click', '.add-note', function() {
    var trackingNumber = $(this).data('track');
    var trackElem = $('#tracking-number');
    trackElem.text('Tracking number:  ' + trackingNumber);
    var trackingInput = $('#tracking-info');
    trackingInput.val(trackingNumber);

    var customerName = $(this).data('customer');
    var customerElem = $('#customer-name');
    customerElem.text('Tên khách hàng:  ' + customerName);

    var rowIdElem = $('#row-id');
    var rowId = $(this).data('id');
    rowIdElem.val(rowId);

    var note = $(this).data('note');
    var noteElem = $('#note-info');
    noteElem.val(note);
});

$('#submit-button').on('click', function(e) {
    var form = $('#note-form');
    var data = JSON.parse('{"' + form.serialize().replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
    $.ajax({
        type: 'POST',
        url: '/' + data.tracking_info + '/note',
        contentType: 'application/json',
        data: data.note,
        dataType: 'json',
        success: function() {
            $('#note-info').val('');
            datatable.row(data.row_id).draw(false);
            $('#myModal').modal('toggle');
        },
        error: function(e) {
            console.log(e);
        }
    });
});

$(document).on('click', '.copy-track', function() {
    var rowId = $(this).data('id');
    var trackingInfo = $(this).data('track');
    var textArea = document.createElement('textarea');
    textArea.value = trackingInfo;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();

    $.ajax({
        type: 'POST',
        url: '/copy/' + trackingInfo,
        success: function() {
            console.log('success');
        },
        error: function(ex) {
            console.log(ex);
        }
    });

    datatable.row(rowId).draw(false);
});

$(document).on('click', '.undo-track', function() {
    var trackingInfo = $(this).data('track');
    var rowId = $(this).data('id');
    $.ajax({
        type: 'POST',
        url: '/undo/' + trackingInfo,
        success: function() {
            console.log('success');
        },
        error: function(ex) {
            console.log(ex);
        }
    });

    datatable.row(rowId).draw(false);
});