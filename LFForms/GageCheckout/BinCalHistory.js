

$(document).ready(function () {

  $('.Submit').hide();

  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");


  $(document).on("onloadlookupfinished", function () {
    $('.Submit').hide();

    generateTicketNumberColumn();

    $('.cal-notes-col div').on("dblclick", function(e) {
      var notes = $(this).find('input[type="text"]').val();
      console.log(notes);
      $.dialog({
        escapeKey: true,
        backgroundDismiss: true,
        title: 'Notes',
        content: notes,
      });
    });

    $('.cal-table').show();
  });


  $(document).on('lookupcomplete', function (e) {

    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }

    if (($('.ed input').val() == '') || ($('.ed input').val() == null)) {
      var curdate = moment().format("MM/DD/YYYY");
      $('.ed input').val(curdate).change();
    }


    $('.cal-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

    generateTicketNumberColumn();
    appendPagination();
    generateFilterRow();
    $('.cal-table').show();

  });

});


function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTableRowCount();

  if (row_count > 0) {
    $('#cal-table-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.cal-table table').parent().append("<div id='cal-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.cal-table table').parent().append("<div id='cal-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.cal-table table').parent().append("<div id='cal-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.cal-table table').parent().append("<div id='cal-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
  else {
    $('#cal-table-pagination').remove();
    $('.cal-table table').parent().append("<div id='cal-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled' href='javascript:void(0);'>‹‹</a></li><li><a class='page-link prev isDisabled' href='javascript:void(0);'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
    return;
  }
}


function callNextPage() {
  $('.cal-table').hide();
  $('.ticket-detail-link').remove();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.cal-table').hide();
  $('.ticket-detail-link').remove();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


function filterTable() {

  if ($('#filterRow').length == 0) {
    return;
  }

  var startDateFilterValue = $('#txtFilter_StartDate').val();
  var endDateFilterVal = $('#txtFilter_EndDate').val();
  var curdate = moment().format("MM/DD/YYYY");


  if ((startDateFilterValue != null) && (startDateFilterValue != '')) {
    $('.std input').val(startDateFilterValue);
  }
  else {
    $('.std input').val('01/01/1980');
  }

  if ((endDateFilterVal != null) && (endDateFilterVal != ''))  {
    $('.ed input').val(endDateFilterVal);
  }
  else {
    $('.ed input').val(curdate);
  }
  
 

  $('.cal-table').hide();
  $('.ticket-detail-link').remove();
  $('.pg input').val(1).change();

}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH><input type='text' class='date-filter' id='txtFilter_StartDate'><input type='text' class='date-filter' id='txtFilter_EndDate'></TH><TH/><TH/><TH/><TH/>"
    $('.cal-table table thead').append(filter_row);
    $("#txtFilter_StartDate").on("change", function () { filterTable(); });
    $("#txtFilter_EndDate").on("change", function () { filterTable(); });

    $("#txtFilter_StartDate").dblclick(function () { $("#txtFilter_StartDate").val(null).change(); });
    $("#txtFilter_EndDate").dblclick(function () { $("#txtFilter_EndDate").val(null).change(); });

  }

}


function generateTicketNumberColumn() {
  $('.ticket-link').remove();
  var ticket_numbers = $('.ticket-number-col input[type="text"]');
  var ticket_ids = $('.ticket-id-col input[type="text"]');
  ticket_numbers.each(function (index) {
    let ticket_id = $(ticket_ids[index]).val();
    let ticket_number = $(this).val();
    let ticket_number_link = $("<a>", { text: ticket_number, class: 'ticket-link', href: 'javascript:void(0);', onclick: `showDetails(${ticket_id})` });
    let has_link = $(this).parent().find('.ticket-link').length;
    if (has_link == 0) {
      $(this).parent().append(ticket_number_link);
    }
  });

}


function getTableRowCount() {
  var row_count = $('.cal-table table tbody tr').length;
  return row_count;
}


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='print-iframe' src='" + src + "' />");
}


function popUpIframe(src, title, height, width) {
  //var iframe_height = height - 100;

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div height='${height}' width='${width}'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);
  $("#popupIFrame").dialog({
    title: title,
    height: height,
    width: width,
    autoOpen: false,
    resizable: true,
    modal: true,
    position: { my: "left top", at: "left top", of: window },
    close: function (event, ui) {
    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
}


function removeAppendedFields() {
  $('#tasklist-pagination').remove();
  $('.ticket-link').remove();
}


function showDetails(ticket_id) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-GAGE-TicketDetails?tid=${ticket_id}&ro=1`, 'Ticket Details', widowHeight, 1200);
}


