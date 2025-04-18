
$(document).ready(function () {
  $(document).prop('title', 'Edit Service Ticket');
  $('.Submit').click(function (e) { submitForm(e); });
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;

  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  window.onmessage = function (event) {
    if (event.data == "CloseDialog") {
      console.log('Add Edit task closing dialog');
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {
      console.log('Add Edit task CloseDialog closing dialog with refresh');
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      window.location = window.location.href
    }
  };

  $(document).on('change', '.user-type-id input', function () {
    setFormEnabledState();
  });
  $(document).on('change', '.anonymous-user-id input', function () {
    var anonymousUserID = Number($('.anonymous-user-id input').val());
    if (anonymousUserID > 0) {
      $('#add-note-button').removeClass('ui-state-disabled');
    }
  });

  $(document).on('dblclick', '[id^="Field20"]', function (e) {
    var ticketDetail = $(this).val();

    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: `Note:`,
      content: ticketDetail,
    });
  });

  $(document).on("onloadlookupfinished", function () {

    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('#add-note-button').append('<div class="table-button ui-button add-button" onclick="addNote()"><span title="Add Note" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Note</div>');

    if ($('#note-textarea').length == 0) {
      $('.section-add-note').append('<div class="section-add-note-content"><textarea id="note-textarea" rows="5" cols="50"></textarea></div>');
    }



    if ((Number($('.sid input').val()) == 5) || (Number($('.sid input').val()) == 6)) {
      $('.ticket-status select').addClass('ui-state-disabled');
      $('.assignee-combo select').addClass('ui-state-disabled');
      $('.ticket-subject input').addClass('ui-state-disabled');
      $('.ticket-details textarea').addClass('ui-state-disabled');
      $('.Submit').hide();
    }
  });

  $(document).on('lookupcomplete', function (e) {
    setDepartmentEmail();
    if (($('.assignee-name input').val() != '') && ($('.assignee-combo select').val() == '')) {
      $('.assignee-combo select').val($('.assignee-name input').val()).change();
    }
    if (($('.status-name input').val() != '') && ($('.ticket-status select').val() == '')) {
      $('.ticket-status select').val($('.status-name input').val()).change();
    }
    var lfUserName = $('.lf-user-name input').val();
    if ($('.network-user-name input').val() == '') {
      $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
    }
    if ((Number($('.site-id input').val()) != 0) && ($('.metrology-email input').val() == '')) {
      $('.site-id input').trigger("change");
    }
    setFormEnabledState();
  });
});


function addNote() {
  var ticket_id = $('.tid input').val();
  var ticket_number = $('.ticket-number input').val();
  var user_id = getUserID();
  console.log(`ticket_id: ${ticket_id}, ticket_number: ${ticket_number}, user_id: ${user_id}`);
  popupIFrame(`http://rmslf/Forms/MPM-AddServiceTicketNote?tid=${ticket_id}&uid=${user_id}`, `Add Note for task '${ticket_number}'`, 400, 650, false);
}


function cancelTicket() {
  var noteField = $('#note-textarea');
  $(noteField).dialog({
    title: 'Add Cancellation Reason (Required)',
    modal: true,
    width: 600,
    height: 400,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {

        if ($('#note-textarea').val().trim() == '') {
          $.alert({ title: 'Must supply cancellation reason!', content: 'Sorry, you need to provide a reason for cancelling this ticket.' });
          return;
        }

        $('.new-note textarea').val($(noteField).val().trim());
        $(this).dialog('close');
        $('#form1').submit();
      }
    }
  });
  var resizeableStyle = $('#note-textarea').attr('style');
  let newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;';
  $('#note-textarea').attr('style', newStyle);
  $(noteField).dialog("open");
}


function completeTicket() {
  var noteField = $('#note-textarea');
  $(noteField).dialog({
    title: 'Add Completion Note (Optional)',
    modal: true,
    width: 600,
    height: 400,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        $('.new-note textarea').val($(noteField).val().trim());
        $(this).dialog('close');
        $('#form1').submit();
      }
    }
  });
  var resizeableStyle = $('#note-textarea').attr('style');
  let newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;';
  $('#note-textarea').attr('style', newStyle);
  $(noteField).dialog("open");

}


function getUserID() {
  var networkUserID = Number($('.user-id input').val());
  var userEnteredUserID = Number($('.anonymous-user-id input').val());

  if (networkUserID > 0) {
    return networkUserID;
  }
  if (userEnteredUserID > 0) {
    return userEnteredUserID;
  }


}


function isMetrologyUser() {
  var userTypeID = Number($('.user-type-id input').val());

  console.log(`userID: ${userTypeID}`);
  if ((userTypeID == 1) || (userTypeID == 2)) {
    return true;
  }
  return false;
}


function popupIFrame(src, title, height, width) {

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div height='${height}' width='${width}'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);
  $("#popupIFrame").dialog({
    title: title,
    height: height,
    width: width,
    autoOpen: false,
    resizable: true,
    modal: true,
    close: function (event, ui) {

    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
}


function resetErrorFields() {

  $('#assigned-cannot-unassign-error').remove();
  $('#active-ticket-requires-assignee-error').remove();
  $('#active-ticket-cannot-inactivate-error').remove();
  $('#assigned-needs-active-status-error').remove();
  $('.ticket-status select').removeClass('parsley-error');
  $('.assignee-combo select').removeClass('parsley-error');

}


function setFormEnabledState() {
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != 'Anonymous User') {
    if (!isMetrologyUser()) {
      console.log('User is not a metrology user');
      $('.ticket-status select').addClass('ui-state-disabled');
      $('.assignee-combo select').addClass('ui-state-disabled');
    }
    else {
      console.log('User is a metrology user');
      $('.ticket-status select').removeClass('ui-state-disabled');
      $('.assignee-combo select').removeClass('ui-state-disabled');
    }
  }
  else {
    $('.show-anonymous input').val(1).change();
    $('.ticket-status select').addClass('ui-state-disabled');
    $('.assignee-combo select').addClass('ui-state-disabled');
    $('#add-note-button').addClass('ui-state-disabled');
  }

}


function setDepartmentEmail() {
  var userTypeID = Number($('.contact-user-type-id input').val());
  var cellLeadEmail = $('.cell-lead-email-address input').val();
  var qeEmail = $('.qe-email-address input').val();
  var meEmail = $('.me-email-address input').val();
  var submitEmailAddressField = $('.department-email-address input');


  if (userTypeID == 0) {
    return;
  }

  switch (userTypeID) {
    case 1:
    case 2:
    case 5:
      $(submitEmailAddressField).val(cellLeadEmail);
      break;
    case 3:
      $(submitEmailAddressField).val(qeEmail);
      break;
    case 4:
      $(submitEmailAddressField).val(meEmail);
      break;
  }

}


function setTicketToWaitingStatus() {
  var noteField = $('#note-textarea');
  $(noteField).dialog({
    title: 'Add What you are waiting on (Required)',
    modal: true,
    width: 600,
    height: 400,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {

        if ($('#note-textarea').val().trim() == '') {
          $.alert({ title: 'Must supply waiting reason!', content: 'Sorry, you need to provide what you are waiting on.' });
          return;
        }

        $('.new-note textarea').val($(noteField).val().trim());
        $(this).dialog('close');
        $('#form1').submit();
      }
    }
  });
  var resizeableStyle = $('#note-textarea').attr('style');
  let newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;';
  $('#note-textarea').attr('style', newStyle);
  $(noteField).dialog("open");

}


function submitForm(e) {

  if (!validateForm()) {
    e.preventDefault();
    return;
  }

  if ($('.metrology-email input').val == '') {
    e.preventDefault();
    $.alert({ title: 'No Metrology email address!', content: 'Sorry, an error has occurred. Please refresh and try again.' });
    return;
  }

  if ($('.department-email-address input').val == '') {
    e.preventDefault();
    $.alert({ title: 'No department email address!', content: 'Sorry, an error has occurred. Please refresh and try again.' });
    return;
  }

  var networkUserName = $('.network-user-name input').val();

  var anonymousUserID = Number($('.anonymous-user-id input').val());
  var anonymousEmployeeNumber = $('.anonymous-user-employee-number input').val();
  var networkUserIDField = $('.user-id input');
  var networkEmployeeNumberField = $('.user-employee-number input');
  var newAssigneeIDField = $('.new-aid input');
  var newAssigneeID = Number(newAssigneeIDField.val());

  if (networkUserName == 'Anonymous User') {
    $(networkUserIDField).val(anonymousUserID);
    $(networkEmployeeNumberField).val(anonymousEmployeeNumber);
  }

  if (newAssigneeID == 0) {
    $(newAssigneeIDField).val(0);
  }


  $('.closeme input').val(1);
  var newTicketStatusID = Number($('.new-sid input').val());
  e.preventDefault();
  switch (newTicketStatusID) {
    case 6:
      cancelTicket();
      break;
    case 5:
      completeTicket();
      break;
    case 3:
      setTicketToWaitingStatus();
      break;
    case 2:
    case 1:
      $('#form1').submit();
  }
}


function validateForm() {
  var isValid = true;
  var ticketStatusField = $('.ticket-status select');
  var assigneeField = $('.assignee-combo select');
  var newTicketStatusID = Number($('.new-sid input').val());
  var oldTicketStatusID = Number($('.sid input').val());
  var newAssigneeID = Number($('.new-aid input').val());
  var oldAssigneeID = Number($('.assignee-id input').val());
  var networkUserName = $('.network-user-name input').val();
  var anonymousUserID = Number($('.anonymous-user-id input').val());
  var anonymousEmployeeNumberField = $('.anonymous-user-employee-number input');


  resetErrorFields();

  if ($('.ticket-subject input').val() == '') {
    $('.ticket-subject input').trigger("blur");
    isValid = false;
  }
  if ($(ticketStatusField).val() == '') {
    $('.ticket-subject input').trigger("blur");
    isValid = false;
  }
  if ($(networkUserName).val() == 'Anonymous User') {
    if ($(anonymousUserID).val() == '') {
      $(anonymousEmployeeNumberField).trigger("blur");
      isValid = false;
    }
  }

  if ((oldAssigneeID > 0) && (newAssigneeID == 0)) {
    assigneeField.addClass('parsley-error');
    assigneeField.parent().append("<ul id='assigned-cannot-unassign-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You cannot unassign as ticket once it has been assigned.</li></ul>");
    isValid = false;
  }

  if ((newTicketStatusID > 1) && (newAssigneeID == 0)) {
    assigneeField.addClass('parsley-error');
    assigneeField.parent().append("<ul id='active-ticket-requires-assignee-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>An active ticket requires an assignee.</li></ul>");
    isValid = false;
  }

  if ((newTicketStatusID == 1) && (newAssigneeID > 0)) {
    assigneeField.addClass('parsley-error');
    assigneeField.parent().append("<ul id='assigned-needs-active-status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>An assigned ticket must have an active status.</li></ul>");
    isValid = false;
  }

  if ((newTicketStatusID == 1) && (oldTicketStatusID > 1)) {
    ticketStatusField.addClass('parsley-error');
    ticketStatusField.parent().append("<ul id='active-ticket-cannot-inactivate-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You cannot set status back to Awaiting Dispatch once it has been set to Work In Progress or Waiting on User.</li></ul>");
    isValid = false;
  }


  return isValid;
}