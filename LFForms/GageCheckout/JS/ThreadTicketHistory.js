

$(document).ready(function () {

  $('.Submit').hide();

  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
   // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = $.fn.button.noConflict();

  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");


  $(document).on("onloadlookupfinished", function () {
    $('.Submit').hide();

    generateTicketNumberColumn();
    $('.ticket-table').show();
  });


  $(document).on('lookupcomplete', function () {

    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
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

  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = getTicketRowCount();

  if (row_count > 0) {
    $('#ticket-table-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")

    }
  }
  else {
    $('#ticket-table-pagination').remove();
    $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
  }
}


function callNextPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  let current_page = Number($('.pg input').val());
  $('.tasklist-page input').val(current_page + 1).trigger("change");
}


function callPrevPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  let current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.tasklist-page input').val(current_page - 1).trigger("change");
}


function checkPermissions() {

  const employee_number = $("#Field87").val();
  const is_active_user = $("#Field88").val().toString();
  let return_val = true;

  if (is_active_user === "False") {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val

}


function formatDateFields(selector) {

  $(`[id^='${selector}']`).each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

}


function generateTicketNumberColumn() {
  $('.ticket-link').remove();
  const ticket_numbers = $('.ticket-number-col input[type="text"]');
  const ticket_ids = $('.ticket-id-col input[type="text"]');
  ticket_numbers.each(function (index) {
    const ticket_id = $(ticket_ids[index]).val();
    const ticket_number = $(this).val();
    const ticket_number_link = $("<a>", { text: ticket_number, class: 'ticket-link', href: 'javascript:void(0);', onclick: `showDetails(${ticket_id})` });
    const has_link = $(this).parent().find('.ticket-link').length;
    if (has_link === 0) {
      $(this).parent().append(ticket_number_link);
    }
  });

}


function getTicketRowCount() {
  return $('.ticket-table table tbody tr').length;
}


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='print-iframe' src='" + src + "' />");
}


function popUpIframe(src, title, height, width) {
  //var iframe_height = height - 100;

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div style='height:${height}px; width:${width}px;'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);
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
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-GAGE-TicketDetails?tid=${ticket_id}&ro=1`, 'Ticket Details', widowHeight, 1200);
}

