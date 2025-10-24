
$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;


  $('.Submit').click(function (e) { validateForm(e); });
  $('.Submit').hide();

  $(document).prop('title', 'Bin Maintenance');
  $('#myElement').removeAttr('style');
  $('#q2').prepend("<fieldset id='Field999' class='radio-checkbox-fieldset filter-checkboxes'><span class='choice'><input name='Field999' id='Field999-0' type='checkbox' value='IncludeInactiveBins'><label class='form-option-label' for='Field999-0'>Include Inactive Bins</label></span></fieldset>");

  $('.edit-bin-isactive-value input').change(function () {
    $('.edit-bin-isactive-combo select').val(Number($('.edit-bin-isactive-value input').val()));
  });
  $('.edit-bin-isactive-combo select').change(function () {
    $('.edit-bin-isactive-value input').val(Number($('.edit-bin-isactive-combo select').val()));
  });
  $('.existing-bin-name-id input').change(function () {
    validateForm();
  });
  $('.existing-ticket-id input').change(function () {
    if ($('.existing-ticket-id input').val().length > 0) {
      $('.edit-bin-isactive-combo select').removeClass("ui-state-disabled").addClass("ui-state-disabled");
    }
    else {
      $('.edit-bin-isactive-combo select').removeClass("ui-state-disabled");
    }
  });
  

  window.onmessage = function (event) {
    //This is the callback from the IFrame.
    //If the event data says "Close Dialog", it destroys the dialog, (so that the close function won't fire).
    //If it says "CloseDialogWithRefresh", it destroys the dialog and refreshes the form.
    //I don't refresh if you add a note, for example. But if you do anything that will show up on the page, (adding time, cloning a task, etc)
    //then I do a refresh.
    if (event.data == "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshPage();
    }
  };

  $(document).on("onloadlookupfinished", function () {
    generateAddButton();
    generateGoBackButtons();
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $(".filter-checkboxes input[type='checkbox']").on("change", function () { filterBinTable(); });
    generateFilterRow();
    $('#txtFilterBinName').keyup(function () { this.value = this.value.toLocaleUpperCase(); });
    $('.add-bin-name input').keyup(function () { this.value = this.value.toLocaleUpperCase(); });
    $('.bin-table').show();
    reApplyFilterValues();
    filterBinTable();
  });

  $(document).on('lookupcomplete', function (e) {
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }
    generateEditButtons();
    changeNumericToYesNo();
    appendPagination();
    generateTicketDetailButtons();
    $('.bin-table').show();
  });
  
});


function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getBinRowCount();

  if (row_count > 0) {
    $('#bin-table-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.bin-table table').parent().append("<div id='bin-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.bin-table table').parent().append("<div id='bin-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.bin-table table').parent().append("<div id='bin-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.bin-table table').parent().append("<div id='bin-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
  else {
    $('#bin-table-pagination').remove();
    $('.bin-table table').parent().append("<div id='bin-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled' href='javascript:void(0);'>‹‹</a></li><li><a class='page-link prev isDisabled' href='javascript:void(0);'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
    return;
  }
}


function callAddBin() {

  $("#Field9-1").prop("checked", true).change();
  $(".add-bin-id input").val(1).change();
  $('.Submit').show();

}


function callEditBin(bin_id) {
  $("#Field9-0").prop("checked", true).change();
  $(".edit-bin-id input").val(bin_id).change();
  $('.Submit').show();
}


function callPrevPage() {
  $('.bin-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


function callNextPage() {
  $('.bin-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


function changeNumericToYesNo() {

  var isactive = $("[id^='Field14']");
  isactive.each(function (index) {
    var isactive_value = $(this).val();
    if ((isactive_value === '1') || (isactive_value === 'Yes')) {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });
}


function checkPermissions() {

  var employee_number = $(".user-employee-number input").val();
  var is_user_active = Number($(".user-isactive input").val());
  var return_val = true;

  if (is_user_active == 0) {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val;
}


function filterBinTable() {

  var binNameFilterValue = $('#txtFilterBinName').val();
  var noteFilterVal = $('#txtFilterNote').val();

  if ($("#Field999-0").is(":checked")) {
    $('.incinactive input').val(1);
  }
  else {
    $('.incinactive input').val(0);
  }

  $('.fbinname input').val(binNameFilterValue);
  $('.fnote input').val(noteFilterVal);

  $('.bin-table').hide();
  $('.pg input').val(1).change();

}


function generateAddButton() {
  var add_buttons = $(".addbutton");
  var is_admin = checkPermissions();

  add_buttons.each(function (index) {
    if (is_admin) {
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Bin' onclick='callAddBin()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  var is_admin = checkPermissions();
  $('.table-button').remove();
  var edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function (index) {
    var btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditBin(" + btn_value + ")' />");
    }

  });
}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH><input type='text' id='txtFilterBinName'></TH><TH/><TH/><TH><input type='text' id='txtFilterNote'></TH><TH/><TH/><TH/>"
    $('.bin-table table thead').append(filter_row);
    $("#txtFilterBinName").on("change", function () { filterBinTable(); });
    $("#txtFilterNote").on("change", function () { filterBinTable(); });

    $("#txtFilterBinName").dblclick(function () { $("#txtFilterBinName").val(null).change(); });
    $("#txtFilterNote").dblclick(function () { $("#txtFilterNote").val(null).change(); });
  }
}


function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


function generateTicketDetailButtons() {

  $('.ticket-details-button').remove();
  
  var current_statuses = $(".current-status input[type=text]");
  var ticket_id_buttons = $(".bin-ticket-id-button input[type=text]");
  var ticket_numbers = $(".ticket-number input[type=text]");

  current_statuses.each(function (index) {
    let ticket_id_field = ticket_id_buttons[index];
    let ticket_id_value = Number(ticket_id_buttons[index].value);
    let ticket_number = ticket_numbers[index].value;

    if (ticket_number.length > 0) {
      var btn_html = `<div class='ui-button ticket-details-button' onclick='showDetails(${ticket_id_value})'><span title='Ticket Details' class='ui-button-icon ui-icon ui-icon-document'></span></div>`
      $(this).val(`Checked Out. Ticket Number: ${ticket_number}.`);
      $(ticket_id_field).parent().append(btn_html);
    }
    else {
      $(this).val("Checked In");
    }
  });
}


function getBinRowCount() {
  var row_count = $('.bin-table table tbody tr').length;
  return row_count;
}


function goBack() {
  $(".edit-bin-id input").val("").change(); //edit
  $(".add-bin-id input").val("").change(); //add
  $('.Submit').hide();
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


function reApplyFilterValues() {
  if ($('#filterRow').length == 0) {
    return;
  }
  var includeInactive = $('.incinactive input').val();
  var binNameFilterValue = $('.fbinname input').val();
  var noteFilterVal = $('.fnote input').val();

  if (includeInactive == 1) {
    $('#Field999-0').prop("checked", true).change();
  }
  else {
    $('#Field999-0').prop("checked", false).change();
  }


  if ((binNameFilterValue != null) && (binNameFilterValue.length > 0)) {
    $('#txtFilterBinName').val(binNameFilterValue);
  }

  if ((noteFilterVal != null) && (noteFilterVal.length > 0)) {
    $('#txtFilterNote').val(noteFilterVal);
  }
  
}


function refreshPage() {

  var includeInactive = Number($('.incinactive input').val());
  var binNameFilterValue = $('.fbinname input').val();
  var noteFilterVal = $('.fnote input').val();
  var page_number = Number($('.pg input').val());
  var current_url = window.location.href;

  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if (page_number > 0) {
    current_url = current_url + `?pg=${page_number}`;
  }

  if ((binNameFilterValue != null) && (binNameFilterValue.length > 0)) {
    current_url = current_url + `&fbinname=${binNameFilterValue}`;
  }

  if ((noteFilterVal != null) && (noteFilterVal.length > 0)) {
    current_url = current_url + `&fnote=${noteFilterVal}`;
  }

  if (includeInactive == 1) {
    current_url = current_url + `&incinactive=${includeInactive}`;
  }

  window.location = current_url;
}


function removeAppendedFields() {
  $('#tasklist-pagination').remove();
  $('.ticket-details-button').remove();
}


function resetPageNumber() {
  $('.bin-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).change();
}


function resetValidationErrors() {
  $('.add-bin-name input').removeClass('parsley-error');

  $('#preexisting-bin-error').remove();
}


function showDetails(ticket_id) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-GAGE-TicketDetails?tid=${ticket_id}`, 'Ticket Details', widowHeight, 1200);
}


function validateForm(e) {

  var isValid = true;
  resetValidationErrors();

  var existingBinNameID = $('.existing-bin-name-id input').val();
  var binNameField = $('.add-bin-name input');

  if (existingBinNameID.length > 0) {
    binNameField.parent().find('#preexisting-bin-error').remove();
    binNameField.parent().append("<ul id='preexisting-bin-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>There is already a bin with this name.</li></ul>");
    binNameField.addClass('parsley-error');
    isValid = false;
  }
  if (isValid == false) {
    if (arguments.length === 1) {
      e.preventDefault();
    }
  }
  else {
    $('#Field999').remove();
  }

}
