/**
 # BinCalHistory.js Documentation

 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/8/2026

 ## Overview

 This script controls the Bin Calibration History form behavior.
 It initializes UI dependencies, renders ticket links, adds paging controls,
 supports date-range filtering, shows ticket details, and generates a printable report URL.

 KEY CONCEPTS:
 LaserFiche Events:
 There are two key LaserFiche events used in this script:
 - onloadlookupfinished: The event fires only once, when all the initial lookups have completed. The kinds of lookups that are completed
 under this event are the ones that do not have any arguments in them, meaning that they can be looked up immediately.
 Examples of this would be Task Types and Task Statuses. These lookups do not depend on any other fields being set.
 - lookupcomplete: This event fires each time a lookup completes after the onloadlookupfinished event has been called.
 Laserfiche has lookup rules applied to certain fields, so that when a field is changed, it triggers a lookup to fill in other fields.
 The user can either change the fields themselves directly, or indirectly.
 An example of a direct change would be when the user chooses a Site from the dropdown.

 Now this gets a bit tricky. The lookupcomplete event can fire multiple times, and we only want to do certain things once. Therefore, we need
 to put logic in there so that it's not doing expensive things again and again.
 There is a way of asking what the TriggerID of the lookup is. (A laserfiche function). But I found this to be kind of a pain to use because
 you have to know the TriggerID of the lookup that you want to respond to, and it's just an integer. Also, if you ever change anything
 in the form, you don't know if the trigger id has changed or not. So, I found it easier to just put logic in the function.
 to make sure that it doesn't, say, iterate through a table or something getting values again and again when we only need it to do it once.

 For an example of what I'm talking about, we're setting the username field in code and causing a lookup (see 'User Permissions' above).
 Because we're setting the field in code and causing a lookup, the onloadlookupfinished event has already fired. Therefore, any logic that
 relies on user fields being populated won't work if you call them from the onloadlookupfinished event. Instead, we have to call them from
 the lookupcomplete event. The unfortunate side effect of this is that the lookupcomplete event can fire multiple times,
 so we have to put logic in there so that it's not doing expensive things again and again. If you do this wrong, you can seriously lengthen
 the load time of the form. Sometimes this is sort of unavoidable because of the way the LFF Lookup rules work,
 but you want to minimize it as much as possible.

 Daisy-Chaining Lookups:
 A side effect of the way lookups work is how they sometimes daisy-chain. Let me explain with an example:
 In our example, we have four fields: LFUserName, NetworkUserName, SiteID, DepartmentLookupTable.
 In the beginning the only field which has anything in it is LFUserName, because LF has filled it in for us.
 We take that value, keeping only the username portion and put that in NetworkUserName.
 This causes a lookup for all the user-related fields, including SiteID. Once the SiteID is set, this in turn
 causes another lookup to pull in all the departments related to that site. The Department Lookup cannot be loaded until
 we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
 various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
 It sort of is what it is. This is what happens when you have to make an application with a non-application framework.

 Pagination:
 Pagination is related to filtering but serves a different pupose. (In actuality, it's really just another form of filtering,
 but instead of limiting rows by name or id, it's filtering which page of results to display.)

 There are a few things regarding pagination that you should know about.
 To begin with, pagination is necessary on this page because there might be hundreds or thousands of rows being returned from the database.
 This is a problem because the web page will time out formatting them all.
 This was a pretty big hurdle to overcome at first. Luckily, LFF allows fields to be filled via stored procedure calls, which take
 arguments. So, as described above in 'Filtering and Sorting', we call a stored procedure to fill the ticket table with information,
 25 rows at a time. This makes things much more manageable. We have a hidden field called 'pg'. So, if pg=1, we return rows 1-25,
 pg=2 returns rows 26-50, and so on. We just wire up the "Next Page" and "Previous Page" buttons to increment or decrement the pg field
 and then trigger a change event on it.

 Known bug:
 There's a bug inherent in the pagination functionality, and that is how we currently enable/disable the "Next Page"
 button. The logic is: if there are 25 rows, there must be another page of results. If there are less than that, we know that there
 isn't another page of results. Where this could come up is when there are a number of results which are exactly divisible by 25.
 On the last page of results, we'll have 25 rows. According to our logic, we're assuming that there's another page of results, so the user
 can click the "Next Page" button and be presented with...nothing. No rows. This is a known issue. Here is my defense:
 Point 1: Pagination isn't really used all that much. People generally filter on what they're looking for instead of paging through
 zillions of rows.
 Point 1.1: Nobody has ever complained about it._
 Point 2: It's not like they can't just click the "Previous Page" button to see the last page.
 Point 3: This problem will only show up if the number of returned rows is divisible by 25, so the likelyhood that anybody is
 ever going to run into it is probably kind of small.

 Possible Improvement to Pagination:
 We could write a stored proc that would tell us how many pages there are for the given filters. That way we could change the pagination
 routine to insert buttons for each page of results. The reason I haven't done it is that it's a lot of fuss and bother just to
 add functionality that nobody's really using anyway. No it wouldn't take long to write, but it seems like needless computation just
 so that the pagination logic is flawless. There are also a bunch of pages that use pagination, so we'd have to have an extra sproc
 for every page that uses pagination. And then there's the extra client-side processing of making a bunch of extra buttons and what not.
 Honestly, the page is slow enough as it is without adding a bunch of extra code for, again, functionality that no one really uses.

 Filtering Behavior:
  There are two main differences between how we normally filter paginated data and how we're doing it here.
   1. This is a sub-form so the bin ID is being set by the parent form.
   2. You can filter by date range. (You can also generate a report if you want of all the calibrations within a date range.)

 Ticket Detail Links:
   `generateTicketNumberColumn()` converts ticket number text fields into clickable links that open
   a read-only ticket details dialog (`showDetails()`).

 Report Printing:
   `printReport()` builds a report URL for `RMS-GAGE-BinCalHistory-Print` using:
   - Required: bin gage id (`bid`)
   - Optional: start date (`std`) and end date (`ed`)
   If optional dates are present but invalid, it shows a jquery-confirm alert and stops.

 ## Dependencies

 - [jQuery](https://jquery.com/)
 - [jQuery UI](https://jqueryui.com/)
 - [moment.js](https://momentjs.com/)
 - [jquery-cookie](https://github.com/carhartl/jquery-cookie)
 - [jquery-confirm](https://craftpip.github.io/jquery-confirm/)
 - [simplePagination.js](https://flaviusmatis.github.io/simplePagination.js/)

 ## Usage

 This script expects these fields/elements to exist:
 - `.pg input` (page number)
 - `.ed input` (end date)
 - `.std input` (start date)
 - `.bid input` (bin gage id)
 - `.cal-table` and nested table structure
 - `.ticket-number-col input[type="text"]`
 - `.ticket-id-col input[type="text"]`
 - `#q0` (popup host insertion point)

 ## Events

 - `onloadlookupfinished`: Hides submit, builds ticket links, wires notes dialogs, reveals table.
 - `lookupcomplete`: Normalizes lookup state, updates links/paging/filter row, reveals table.
 */
let should_print_report = false;
$(function () {

  $('.Submit').hide();

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
    $.fn.bootstrapBtn = $.fn.button.noConflict();
  }).then(function () {
    $('#q0').append("<div class='hidden' id='popUpDiv'></div>");
  });

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
      const curdate = moment().format("MM/DD/YYYY");
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
  const curdate = moment().format("MM/DD/YYYY");


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
  const report_url_root = `${window.location.origin}/Forms/`;
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
  popUpIframe(`${window.location.origin}/Forms//RMS-GAGE-TicketDetails?tid=${ticket_id}&ro=1`, 'Ticket Details', widowHeight, 1200);
}


