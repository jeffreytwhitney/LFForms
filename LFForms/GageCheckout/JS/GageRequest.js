$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Gage Requests');
  $('.Submit').click(function (e) { submitForm(e); });
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;


  $(document).on("onloadlookupfinished", function () {
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
    generateGoBackButtons();

    if ($('.add-button').length == 0) {
      var add_button = '<div class="add-button ui-button ui-corner-all ui-widget" onclick="callAddGage()"><span title="Request Gage" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Request Gage</div><div><br></div>'
      $(add_button).insertBefore('.gage-request-table table');
    }

  });

  $(document).on('lookupcomplete', function (e) {

  });

  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('change', '.cr-employee-name input', function (e) {
    let crEmployeeNumberValue = $('.cr-employee-number input').val();
    let crEmployeeNameValue = $('.cr-employee-name input').val();

    $('.submit-employee-number input').val(crEmployeeNumberValue);
    $('.submit-employee-name input').val(crEmployeeNameValue);
  });

  $(document).on('change', '.anoka-employee-name input', function (e) {
    let anokaEmployeeNumberValue = $('.anoka-employee-number input').val();
    let anokaEmployeeNameValue = $('.anoka-employee-name input').val();

    $('.submit-employee-number input').val(anokaActivateEmployeeNumberValue);
    $('.submit-employee-name input').val(anokaActivateEmployeeNameValue);
  });

});


function callAddGage() {
  $('.add-id input').val(1).change();
  $('.Submit').show();
}

function callGoBack() {
  $('.add-id input').val(0).change();
  $('.Submit').hide();
}





function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


function generateTicketNumberColumn() {
  $('.ticket-detail-link').remove();
  var ticket_numbers = $('.ticket-table-ticket-number input[type="text"]');
  var ticket_ids = $('.ticket-table-id input[type="text"]');
  ticket_numbers.each(function (index) {
    let ticket_id = $(ticket_ids[index]).val();
    let ticket_number = $(this).val();
    let ticket_number_link = $("<a>", { text: ticket_number, class: 'ticket-detail-link', href: 'javascript:void(0);', onclick: `showDetails(${ticket_id})` });
    $(this).parent().append(ticket_number_link);
  });

}

function submitForm(e) {
  var siteID = $('.site-id input').val();
  var crEmployeeNumber = $('.cr-employee-number input').val();
  var anokaEmployeeNumber = $('.anoka-employee-number input').val();
  var crEmployeeName = $('.cr-employee-name input').val();
  var anokaEmployeeName = $('.anoka-employee-name input').val();

  if (siteID == '1') {
    $('.submit-employee-number input').val(crEmployeeNumber);
    $('.submit-employee-name input').val(crEmployeeName);
  }

  if (siteID == '2') {
    $('.submit-employee-number input').val(anokaEmployeeNumber);
    $('.submit-employee-name input').val(anokaEmployeeName);
  } 

  
}
