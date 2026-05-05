
$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;


  $('.Submit').on("click", function (e) { validateForm(e); });
  $('.Submit').hide();

  $(document).prop('title', 'Thread Maintenance');
  $('#myElement').removeAttr('style');
  $('#q10').prepend("<fieldset id='Field999' class='radio-checkbox-fieldset filter-checkboxes'><span class='choice'><input name='Field999' id='Field999-0' type='checkbox' value='IncludeInactivethreads'><label class='form-option-label' for='Field999-0'>Include InActive threads</label></span></fieldset>");

  //This is in the Edit Thread section. If the user changes the value in the text box, it updates the combo box.
  $('.edit-thread-isactive-value input').on("change", function () {
    $('.edit-thread-isactive-combo select').val(Number($('.edit-thread-isactive-value input').val()));
  });
  //This is in the Edit Thread section. If the user changes the value in the combo box, it updates the text box.
  $('.edit-thread-isactive-combo select').on("change", function () {
    $('.edit-thread-isactive-value input').val(Number($('.edit-thread-isactive-combo select').val()));
  });

  //This is in the Edit Thread section. If the user changes the value in the Thread Type text box, it updates the combo box.
  $('.edit-thread-type-combo select').on("change", function () {
    $('.edit-thread-type-id input').val(Number($('.edit-thread-type-combo select').val()));
  });
  //This is in the Edit Thread section. If the user changes the value in the Thread Type combo box, it updates the text box.
  $('.edit-thread-type-id input').on("change", function () {
    $('.edit-thread-type-combo select').val(Number($('.edit-thread-type-id input').val()));
  });

  //If the thread is checked out to a ticket, disable the isactive combo box.
  $('.existing-ticket-id input').on("change", function () {
    if ($('.existing-ticket-id input').val().length > 0) {
      $('.edit-thread-isactive-combo select').removeClass("ui-state-disabled").addClass("ui-state-disabled");
    }
    else {
      $('.edit-thread-isactive-combo select').removeClass("ui-state-disabled");
    }
  });

  //This is in the Add Thread section. If the user changes the value in the Thread Type text box, it updates the combo box.
  $('.add-thread-type-combo select').on("change", function () {
    $('.add-thread-type-id input').val(Number($('.add-thread-type-combo select').val()));
  });

  //This is in the Add Thread section. If there is a thread with the same name, disable the submit button.
  $('.existing-thread-name-id input').on("change", function () {
    validateForm();
  });

  window.onmessage = function (event) {
    //This is the callback from the IFrame.
    //If the event data says "Close Dialog", it destroys the dialog, (so that the close function won't fire).
    //If it says "CloseDialogWithRefresh", it destroys the dialog and refreshes the form.
    //I don't refresh if you add a note, for example. But if you do anything that will show up on the page, (adding time, cloning a task, etc)
    //then I do a refresh.
    if (event.data === "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data === "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshPage();
    }
  };

  $(document).on("onloadlookupfinished", function () {
    generateAddButton();
    generateGoBackButtons();
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $(".filter-checkboxes input[type='checkbox']").on("change", function () { filterThreadTable(); });
    generateFilterRow();
    $('#txtFilterThreadName').keyup(function () { this.value = this.value.toLocaleUpperCase(); });
    $('#txtFilterDesc').keyup(function () { this.value = this.value.toLocaleUpperCase(); });
    $('.add-thread-name input').keyup(function () { this.value = this.value.toLocaleUpperCase(); });
    $('.thread-table').show();
    reApplyFilterValues();
    filterThreadTable();
  });

  $(document).on('lookupcomplete', function (e) {
    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
    }
    generateEditButtons();
    changeNumericToYesNo();
    appendPagination();
    generateTicketDetailButtons();
    $('.thread-table').show();
  });

});


function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = getTableRowCount();

  if (row_count > 0) {
    $('#thread-table-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.thread-table table').parent().append("<div id='thread-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.thread-table table').parent().append("<div id='thread-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.thread-table table').parent().append("<div id='thread-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.thread-table table').parent().append("<div id='thread-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
      return;
    }
  }
  else {
    $('#thread-table-pagination').remove();
    $('.thread-table table').parent().append("<div id='thread-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
    return;
  }

}


function callAddThread() {

  $("#Field7-1").prop("checked", true).trigger("change");
  $(".add-threadgage-id input").val(1).trigger("change");
  $('.Submit').show();

}


function callEditThread(thread_id) {
  $("#Field7-0").prop("checked", true).trigger("change");
  $(".edit-threadgage-id input").val(thread_id).trigger("change");
  $('.Submit').show();
}


function callPrevPage() {
  $('.thread-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


function callNextPage() {
  $('.thread-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


function changeNumericToYesNo() {

  const isactive = $("[id^='Field16']");
  isactive.each(function (index) {
    const isactive_value = $(this).val();
    if ((isactive_value === '1') || (isactive_value === 'Yes')) {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });
}


function checkPermissions() {

  const employee_number = $(".user-employee-number input").val();
  const is_user_active = Number($(".user-isactive input").val());
  let return_val = true;

  if (is_user_active === 0) {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val;
}


function filterThreadTable() {

  const threadNameFilterValue = $('#txtFilterThreadName').val();
  const descFilterVal = $('#txtFilterDesc').val();

  if ($("#Field999-0").is(":checked")) {
    $('.incinactive input').val(1);
  }
  else {
    $('.incinactive input').val(0);
  }

  $('.fthreadname input').val(threadNameFilterValue);
  $('.fthreaddesc input').val(descFilterVal);

  $('.thread-table').hide();
  $('.pg input').val(1).trigger("change");

}


function generateAddButton() {
  const add_buttons = $(".addbutton");
  const is_admin = checkPermissions();

  add_buttons.each(function (index) {
    if (is_admin) {
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Thread' onclick='callAddThread()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  const is_admin = checkPermissions();
  $('.table-button').remove();
  const edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function (index) {
    const btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditThread(" + btn_value + ")' />");
    }

  });
}


function generateFilterRow() {

  if ($('#filterRow').length === 0) {

    const filter_row = "<TR id='filterRow'><TH/><TH/><TH><input type='text' id='txtFilterThreadName'></TH><TH><input type='text' id='txtFilterDesc'></TH><TH/><TH/><TH/><TH/><TH/><TH/><TH/>"
    $('.thread-table table thead').append(filter_row);
    $("#txtFilterThreadName").on("change", function () { filterThreadTable(); });
    $("#txtFilterDesc").on("change", function () { filterThreadTable(); });

    $("#txtFilterThreadName").on("dblclick", function () { $("#txtFilterThreadName").val(null).trigger("change"); });
    $("#txtFilterDesc").on("dblclick", function () { $("#txtFilterDesc").val(null).trigger("change"); });
  }
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


function generateTicketDetailButtons() {

  $('.ticket-details-button').remove();

  const current_statuses = $(".current-status input[type=text]");
  const ticket_id_buttons = $(".thread-ticket-id-button input[type=text]");
  const ticket_numbers = $(".ticket-number input[type=text]");

  current_statuses.each(function (index) {
    const ticket_id_field = ticket_id_buttons[index];
    const ticket_id_value = Number($(ticket_id_field).val());
    const ticket_number = $(ticket_numbers[index]).val();

    if (ticket_number.length > 0) {
      const btn_html = `<div class='ui-button ticket-details-button' onclick='showDetails(${ticket_id_value})'><span title='Ticket Details' class='ui-button-icon ui-icon ui-icon-document'></span></div>`
      $(this).val(`Checked Out. Ticket Number: ${ticket_number}.`);
      $(ticket_id_field).parent().append(btn_html);
    }
    else {
      $(this).val("Checked In");
    }
  });
}


function getTableRowCount() {
  const row_count = $('.thread-table table tbody tr').length;
  return row_count;
}


function goBack() {
  $(".edit-threadgage-id input").val("").trigger("change"); //edit
  $(".add-threadgage-id input").val("").trigger("change"); //add
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
  if ($('#filterRow').length === 0) {
    return;
  }

  const includeInactive = $('.incinactive input').val();
  const threadNameFilterValue = $('.fthreadname input').val();
  const descFilterVal = $('.fthreaddesc input').val();

  if (includeInactive === 1) {
    $('#Field999-0').prop("checked", true).trigger("change");
  }
  else {
    $('#Field999-0').prop("checked", false).trigger("change");
  }

  if ((threadNameFilterValue !== null) && (threadNameFilterValue.length > 0)) {
    $('#txtFilterThreadName').val(threadNameFilterValue);
  }

  if ((descFilterVal !== null) && (descFilterVal.length > 0)) {
    $('#txtFilterDesc').val(descFilterVal);
  }

}


function refreshPage() {

  const threadNameFilterValue = $('.fthreadname input').val();
  const descFilterVal = $('.fthreaddesc input').val();
  const page_number = Number($('.pg input').val());
  const includeInactive = Number($('.incinactive input').val());
  let current_url = window.location.href;

  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if (page_number > 0) {
    current_url = current_url + `?pg=${page_number}`;
  }



  if ((threadNameFilterValue !== null) && (threadNameFilterValue.length > 0)) {
    current_url = current_url + `&fthreadname=${threadNameFilterValue}`;
  }

  if ((descFilterVal !== null) && (descFilterVal.length > 0)) {
    current_url = current_url + `&fthreaddesc=${descFilterVal}`;
  }

  if (includeInactive === 1) {
    current_url = current_url + `&incinactive=${includeInactive}`;
  }


  window.location = current_url;
}


function removeAppendedFields() {
  $('#tasklist-pagination').remove();
  $('.ticket-details-button').remove();
}


function resetPageNumber() {
  $('.thread-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).trigger("change");
}


function resetValidationErrors() {
  $('.add-thread-table-new-thread-number input').removeClass('parsley-error');

  $('#preexisting-thread-error').remove();
}


function showDetails(ticket_id) {
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-GAGE-TicketDetails?tid=${ticket_id}`, 'Ticket Details', widowHeight, 1200);
}


function validateForm(e) {

  let isValid = true;
  resetValidationErrors();

  const existingthreadNameID = $('.existing-thread-name-id input').val();
  const threadNameField = $('.add-thread-name input');

  if (existingthreadNameID.length > 0) {
    threadNameField.parent().find('#preexisting-thread-error').remove();
    threadNameField.parent().append("<ul id='preexisting-thread-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>There is already a thread with this name.</li></ul>");
    threadNameField.addClass('parsley-error');
    isValid = false;
  }
  if (isValid === false) {
    if (arguments.length === 1) {
      e.preventDefault();
    }
  }
  else {
    $('#Field999').remove();
  }

}

