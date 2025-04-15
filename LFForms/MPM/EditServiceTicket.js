

$(document).ready(function () {
  $(document).prop('title', 'Add Service Ticket');
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
      $("#form1").submit();
    }
  };

  $(document).on("onloadlookupfinished", function () {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('#add-note-button').append('<div class="table-button ui-button add-button" onclick="addNote()"><span title="Add Note" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Note</div>');
    $('.section-add-note').append('<div class="section-add-note-content"><textarea class="note-textarea" rows="5" cols="50"></textarea></div>');
    var lfUserName = $('.lf-user-name input').val();
    if (lfUserName != 'Anonymous User') {
      $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
    }
    else {
      $('.ticket-status select').addClass('ui-state-disabled');
      $('.assignee-combo select').addClass('ui-state-disabled');
      $('#add-note-button').addClass('ui-state-disabled');
    }
    
  });

  $(document).on('lookupcomplete', function (e) {
    setDepartmentEmail();
  });

  $(document).on('change', '.status-name input', function () {
    $('.ticket-status select').val($('.status-name input').val()).change();
  });

  $(document).on('change', '.assignee-name input', function () {
    $('.assignee-combo select').val($('.assignee-name input').val()).change();
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

});


function addNote() {
  var task_id = $('.tid input').val();
  var ticket_number = $('.ticket-number input').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${tid}&nt=1`, `Add Note for task '${ticket_number}'`, 400, 650, false);
}


function getCancelNote() {
  var noteField = $('.note-textarea').clone();

  $(noteField).dialog({
    title: 'Add Note',
    modal: true,
    width: 600,
    height: 400,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        $(this).dialog('close');
      }
    }
  });
}


function callCompleteTask() {
  var noteField = $('.note-textarea').clone();

  $(noteField).dialog({
    title: 'Add Note',
    modal: true,
    width: 600,
    height: 400,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        $(this).dialog('close');
      }
    }
  });
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
      if (cancelSubmit) {
        return false;
      }
    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
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


function submitForm(e) {

  e.preventDefault();
  var noteField = $('.note-textarea').clone();

  $(noteField).dialog({
    title: 'Add Note',
    modal: true,
    width: 600,
    height: 400,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        $(this).dialog('close');
      }
    }
  });
  
  $(noteField).dialog("open");

  var noteText = $('.note-textarea').val();
  
  
  
}