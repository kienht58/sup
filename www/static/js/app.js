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
                    console.log(elem['if need Special Instructions'])
                    fileData.push({
                        trackingNumber: trackingNumber,
                        quantity: elem['Quantity'],
                        price: elem['Price USD'],
                        customer: _getCustomerInfo(elem['Shipping Address']),
                        orderSize: elem['Size'],
                        totalPrice: elem['Total USD'],
                        orderDate: _formatDate(elem['Date orders']),
                        note: elem['if need Special Instructions'] ? elem['if need Special Instructions'] : ''
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
    [month, day, year] = str.split('.');
    month = (month < 10) ? '0' + month : month;
    day = (day < 10) ? '0' + day : day;

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
            {'data': 'note'},
            {'data': 'order_date'}
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
        ],
        createdRow: function(row, data, index) {
            if(data.copied) {
                $(row).css('background-color', '#646167');
                $(row).css('color', '#fff');
            }
        }
    });
});

// function buildActionColumn(data) {
//     return '' +
//         '<a class="table-action-btn" title="Edit">' +
//             '<i class="fa fa-edit text-primary"></i>' +
//         '</a>'
// }

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

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