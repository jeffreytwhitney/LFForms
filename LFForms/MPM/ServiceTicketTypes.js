$(document).ready(function () {
  var lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  $('.Submit').hide();
  $(document).prop('title', 'Service Ticket Types');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  $('.Submit').click(function (e) { submitForm(e); });

  $(document).on('change', '.edit-is-active-value input', function () {
    var isActive = $('.edit-is-active-value input').val();
    $(`.edit-tickettype-is-active input[type='radio'][value='${isActive}']`).prop("checked", true);
  });

  $(document).on('change', ".edit-tickettype-is-active input[type='radio']", function () {
    var isActive = $(this).val();
    $('.edit-is-active-value input').val(isActive);
  });

  $(document).on('lookupcomplete', function (e) {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit TicketType", "callEditTicketType");
    generateGoBackButtons();

    if (isAdminUser()) {
      if ($('.add-button').length == 0) {
        var add_button = '<div class="ui-button add-button" onclick="callAddTicketType()"><span title="Add TicketType" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Service Ticket Type</div>';
        $(add_button).insertBefore('.tickettype-table table');
      }
    }
  });

  $(document).on("onloadlookupfinished", function (e) {
    $('.network-user-name input').trigger("change");
  });

});


function callAddTicketType() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-id input').val(1).change();
  $('.Submit').show();
}


function callEditTicketType(tickettypeID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-id input').val(tickettypeID).change();
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


function callGoBack() {
  $(".add-id input").val(0).change();
  $(".edit-id input").val(0).change();
  $('.Submit').hide();
}


function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    var btn_value = $(this).val();
    var btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`

    var has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button == 0) {
      $(this).parent().append(btn_html);
    }
  });
}


function isAdminUser() {
  if ($('.user-isadmin input').val() == '1') {
    return true;
  }
  return false;
}

function submitForm(e) {


}

