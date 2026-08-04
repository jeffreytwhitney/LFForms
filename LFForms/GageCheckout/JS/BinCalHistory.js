let should_print_report = false;
$(function () {

  $('.Submit').hide();

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    
  }).fail(function () {
    console.error('Failed to load required scripts');
  });

  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  $.fn.bootstrapBtn = $.fn.button.noConflict(); // return $.fn.button to previously assigned value

  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");
  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const printEvent = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      function show_print() {
        $("#print-iframe").get(0).contentWindow.print();
      }
      window.setTimeout(show_print, 800); // 2 seconds
    }
  });

  $(document).on("onloadlookupfinished", function () {
    $('.Submit').hide();

    generateTicketNumberColumn();

      $('.cal-notes-col div').on("dblclick", function() {
      const notes = $(this).find('input[type="text"]').val();
      $.dialog({
        escapeKey: true,
        backgroundDismiss: true,
        title: 'Notes',
        content: notes,
      });
    });

    $('.cal-table').show();
  });


  $(document).on('lookupcomplete', function () {

    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
    }

    if (($('.ed input').val() === '') || ($('.ed input').val() === null)) {
      const curdate = moment(fdmax).format("MM/DD/YYYY");
      $('.ed input').val(curdate).trigger("change");
    }


    $('.cal-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

    generateTicketNumberColumn();
    appendPagination();
    generateFilterRow();
    $('.cal-table').show();

  });

});


function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = getTableRowCount();

  if (row_count > 0) {
    $('#cal-table-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.cal-table table').parent().append("<div id='cal-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.cal-table table').parent().append("<div id='cal-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.cal-table table').parent().append("<div id='cal-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.cal-table table').parent().append("<div id='cal-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
    }
  }
  else {
    $('#cal-table-pagination').remove();
    $('.cal-table table').parent().append("<div id='cal-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
  }
}


function callNextPage() {
  $('.cal-table').hide();
  $('.ticket-detail-link').remove();
  let current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


function callPrevPage() {
  $('.cal-table').hide();
  $('.ticket-detail-link').remove();
  let current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


function filterTable() {

  if ($('#filterRow').length === 0) {
    return;
  }

  const startDateFilterValue = $('#txtFilter_StartDate').val();
  const endDateFilterVal = $('#txtFilter_EndDate').val();
  const curdate = moment(fdmax).format("MM/DD/YYYY");


  if ((startDateFilterValue !== null) && (startDateFilterValue !== '')) {
    $('.std input').val(startDateFilterValue);
  }
  else {
    $('.std input').val('01/01/1980');
  }

  if ((endDateFilterVal !== null) && (endDateFilterVal !== ''))  {
    $('.ed input').val(endDateFilterVal);
  }
  else {
    $('.ed input').val(curdate);
  }
  
 

  $('.cal-table').hide();
  $('.ticket-detail-link').remove();
  $('.pg input').val(1).trigger("change");

}


function generateFilterRow() {

  if ($('#filterRow').length === 0) {
    const print_button = '<div class="table-button ui-button print-button" onclick="printReport()"><span title="Print" class="ui-button-icon ui-icon ui-icon-print"></span>Print</div>'
    const filter_row = `<TR id='filterRow'><TH>${print_button}</TH><TH/><TH/><TH><input type='text' class='date-filter' id='txtFilter_StartDate'><input type='text' class='date-filter' id='txtFilter_EndDate'></TH><TH/><TH/><TH/><TH/>`
    $('.cal-table table thead').append(filter_row);
    $("#txtFilter_StartDate").on("change", function () { filterTable(); });
    $("#txtFilter_EndDate").on("change", function () { filterTable(); });

    $("#txtFilter_StartDate").on("dblclick", function () { $("#txtFilter_StartDate").val(null).trigger("change"); });
    $("#txtFilter_EndDate").on("dblclick", function () { $("#txtFilter_EndDate").val(null).trigger("change"); });

  }

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


function getTableRowCount() {
  return $('.cal-table table tbody tr').length;
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


function printReport() {

  should_print_report = true;
  const domain = document.location.hostname;
  const report_url_root = "http://" + domain + "/Forms/";
  let report_url = "";

  const bin_gage_id = $('.bid input').val();
  const start_date = $('#txtFilter_StartDate').val();
  const end_date = $('#txtFilter_EndDate').val();

  if (bin_gage_id.length === 0) {
    return;
  }

  report_url = report_url_root + `RMS-GAGE-BinCalHistory-Print?bid=${bin_gage_id}`;

  if ((start_date !== null) && (start_date !== '')) {
    if ($.datepicker.parseDate("dd/mm/yy", start_date)) {
      report_url = report_url + "&std=" + start_date;
    }
    else {
      $.alert({
        title: 'Invalid Date!',
        content: "The start date you entered isn't a valid date."
      });
      return;
    }
  }

  if ((end_date !== null) && (end_date !== '')) {
    if ($.datepicker.parseDate("dd/mm/yy", end_date)) {
      report_url = report_url + "&ed=" + end_date;
    }
    else {
      $.alert({
        title: 'Invalid Date!',
        content: "The end date you entered isn't a valid date."
      });
      return;
    }
  }



  loadiFrame(report_url);
  should_print_report = false;
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



