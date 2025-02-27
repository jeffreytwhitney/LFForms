

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
    $('.ticket-table').show();
  });


  $(document).on('lookupcomplete', function (e) {

    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }

    $('.creation-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.latest-cal-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.cal-due-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

    generateTicketNumberColumn();
    appendPagination();
    $('.ticket-table').show();

  });

});


function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTicketRowCount();

  if (row_count > 0) {
    $('#ticket-table-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
  else {
    $('#ticket-table-pagination').remove();
    $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled' href='javascript:void(0);'>‹‹</a></li><li><a class='page-link prev isDisabled' href='javascript:void(0);'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
    return;
  }
}


function callNextPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  $('.tasklist-page input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.tasklist-page input').val(current_page - 1).change();
}


function formatDateFields(selector) {

  $(`[id^='${selector}']`).each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

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


function getTicketRowCount() {
  var row_count = $('.ticket-table table tbody tr').length;
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

