var cellLeadMap = new Map();
var cellLeadNameMap = new Map();

$(document).ready(function () {
  var lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  $('.Submit').hide();
  $(document).prop('title', 'Schedule Maintenance');
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
    $(`.edit-schedule-is-active input[type='radio'][value='${isActive}']`).prop("checked", true);
  });
  $(document).on('change', '.edit-name-trimming-value input', function () {
    var isAdmin = $('.edit-name-trimming-value input').val();
    $(`.edit-do-part-name-trimming input[type='radio'][value='${isAdmin}']`).prop("checked", true);
  });
  $(document).on('change', ".edit-schedule-is-active input[type='radio']", function () {
    var isActive = $(this).val();
    $('.edit-is-active-value input').val(isActive);
  });
  $(document).on('change', ".edit-do-part-name-trimming input[type='radio']", function () {
    var isAdmin = $(this).val();
    $('.edit-name-trimming-value input').val(isAdmin);
  });
  $(document).on('change', '.edit-schedule-owner-cbo select', function () {
    var ownerName = $(this).val();
    if (cellLeadNameMap.has(ownerName)) {
      var ownerID = cellLeadNameMap.get(ownerName);
      $('.edit-owner-id input').val(ownerID);
    }
    else {
      $('.edit-owner-id input').val(0);
    }
  });
  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('lookupcomplete', function (e) {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Schedule", "callEditSchedule");
    fillCellLeadSelect();
    generateGoBackButtons();
    loadCellLeadMap();
    if (isAdminUser()) {
      if ($('.add-button').length == 0) {
        var add_button = '<div class="ui-button add-button" onclick="callAddSchedule()"><span title="Add Schedule" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Schedule</div>';
        $(add_button).insertBefore('.schedule-table table');
      }
    }

    
  });

  $(document).on("onloadlookupfinished", function (e) {
    $('.network-user-name input').trigger("change");
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
  });

});


function callAddSchedule() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-id input').val(1).change();
  $('.Submit').show();
}


function callEditSchedule(scheduleID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-id input').val(scheduleID).change();
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


function callGoBack() {
  $(".add-id input").val(0).change();
  $('.add-owner-id input').val(0).change(); 
  $('.add-department-id input').val(0).change(); 
  $('.add-schedule-owner-cbo select').val(''); 

  $(".edit-id input").val(0).change();
  $('.edit-owner-id input').val(0).change();
  $('.edit-department-id input').val(0).change();
  $('.edit-schedule-owner-cbo select').val('');

  $('.Submit').hide();
}


function fillCellLeadSelect() {

  var ownerID = Number($('.edit-owner-id input').val());
  var selectLength = $('.edit-schedule-owner-cbo select option').length;

  if ((cellLeadMap.has(ownerID)) && (selectLength > 1)) {
    var ownerName = cellLeadMap.get(ownerID);
    $('.edit-schedule-owner-cbo select').val(ownerName);
  }
  else {
    $('.edit-schedule-owner-cbo select').val('');
  }
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


function loadCellLeadMap() {
  if (cellLeadMap.keys.length == 0) {
    var cellLead_rows = $('.celllead-lookup-table table tbody tr');
    if (cellLead_rows.length == 0) {
      return;
    }
    cellLead_rows.each(function (index) {
      cellLeadID = Number($(this).find('.celllead-lookup-table-id input').val());
      cellLeadName = $(this).find('.celllead-lookup-table-name input').val();
      cellLeadMap.set(cellLeadID, cellLeadName);
      cellLeadNameMap.set(cellLeadName, cellLeadID);
    });
  }
}


function submitForm(e) {

}

