
$(document).ready(function () {
  var lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  $('.Submit').hide();
  $(document).prop('title', 'User Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  $(document).on('lookupcomplete', function (e) {
    generateGoBackButtons();
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Department", "callEditDepartment");
    if ($('.add-button').length == 0) {
      var add_button = '<div class="ui-button add-button" onclick="callAddDepartment()"><span title="Add Department" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Department</div>'
      $(add_button).insertBefore('.department-table table');
    }
  });

  $(document).on("onloadlookupfinished", function (e) {
    generateGoBackButtons();
    $('.network-user-name input').trigger("change");
  });

});


function callAddDepartment() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-department-id input').val(1).change();
  $('.Submit').show();
}


function callEditDepartment(departmentID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-department-id input').val(departmentID).change();
  $('.Submit').show();
}


function callGoBack() {
  $(".add-user-id input").val(0).change();
  $(".edit-user-id input").val(0).change();
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
    var btn_html = `<div class='table-button ui-button'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}' onclick='${buttonFunction}(${btn_value})'/></div>`

    var has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button == 0) {
      $(this).parent().append(btn_html);
    }
  });
}

