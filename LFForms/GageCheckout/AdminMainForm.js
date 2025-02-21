$(document).ready(function () {
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $(document).prop('title', 'Gage Administration MainForm');
  $('.Submit').hide();
  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");

  $(document).on("onloadlookupfinished", function () {
    generateAppliationLinks();
  });


});


function checkPermissions() {

  var employee_number = $(".user-id input").val();
  var is_active_user = Number($(".user-isactive input").val());
  var return_val = true;


  if (typeof is_active_user === 'undefined') {
    return false;
  }

  if (typeof employee_number === 'undefined') {
    return false;
  }


  if ((is_active_user == 0) || (is_active_user == null)) {
    return_val = false;
  }

  if ((employee_number == '') || (employee_number == null)) {
    return_val = false;
  }

  return return_val

}


function executeIFrameUpdate() {

  var execute_url = `http://rmslf/Forms/RMS-GAGE-GenerateOverDueEmails`;

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<iframe id='popupIFrame' name='myname' src='${execute_url}'/>`);
}


function generateAppliationLinks() {

  var hasPermissions = checkPermissions();
  var isAdmin = isUserAdmin();
  var overdueTicketRunMessage = generateOverdueTicketMessage(false);
  var mainWindowHTML = '<div class="row"><div class="column"><ul>';

  if (hasPermissions) {
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/GageTicketAdministration" title="Gage Administration" target="_blank">Gage Administration</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/GageCalibration" title="Gage Calibration" target="_blank">Gage Calibration</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/Gage-MissingGages" title="Missing Thread Gages" target="_blank">Missing Thread Gages</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-CheckoutMainform" title="Gage Checkout" target="_blank">Gage Checkout</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-TicketHistory" title="Ticket History" target="_blank">Ticket History</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-BinHistory" title="Ticket History" target="_blank">Bin History</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-ThreadGageHistory" title="Ticket History" target="_blank">Thread Gage History</a></li>'
    mainWindowHTML = mainWindowHTML + '<li></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Generate Overdue Ticket EMails" onclick="generateOverdueEmails()">Generate Overdue Ticket EMails</a></li>'
    mainWindowHTML = mainWindowHTML + '</ul></div><div class="column"><ul>'

    if (isAdmin) {
      mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/GageUserMaintenance" title="User Maintenance" target="_blank">User Maintenance</a></li>'
    }
    else {
      mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="User Maintenance" onclick="showPermissionAlert()">User Maintenance</a></li>';
    }
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-CellLeaders" title="Cell Leader Maintenance" target="_blank">Cell Leader Maintenance</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-MachineGroups" title="Machine Group Maintenance" target="_blank">Machine Group Maintenance</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-Departments" title="Department Maintenance" target="_blank">Department Maintenance</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-ThreadGages" title="Thread Gage Maintenance" target="_blank">Thread Gage Maintenance</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-Bins" title="Pin Bin Maintenance" target="_blank">Pin Bin Maintenance</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-PinTypes" title="Pin Type Maintenance" target="_blank">Pin Type Maintenance</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-Sites" title="Site Maintenance" target="_blank">Site Maintenance</a></li>'
    mainWindowHTML = mainWindowHTML + '</ul></div></div>'

  }
  else {
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Gage Administration" onclick="showPermissionAlert()">Gage Administration</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Gage Calibration" onclick="showPermissionAlert()">Gage Calibration</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Missing Thread Gages" onclick="showPermissionAlert()">Missing Thread Gages</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Gage Checkout" onclick="showPermissionAlert()">Gage Checkout</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Ticket History" onclick="showPermissionAlert()>Ticket History</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Bin History" onclick="showPermissionAlert()>Bin History</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Thread Gage History" onclick="showPermissionAlert()>Thread Gage History</a></li>'
    mainWindowHTML = mainWindowHTML + '<li></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Generate Overdue Ticket EMails" onclick="showPermissionAlert()">Generate Overdue Ticket EMails</a></li>';
    mainWindowHTML = mainWindowHTML + '</ul></div><div class="column"><ul>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="User Maintenance" onclick="showPermissionAlert()">User Maintenance</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Cell Leader Maintenance" onclick="showPermissionAlert()">Cell Leader Maintenance</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Machine Group Maintenance" onclick="showPermissionAlert()">Machine Group Maintenance</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Department Maintenance" onclick="showPermissionAlert()">Department Maintenance</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Thread Gage Maintenance" onclick="showPermissionAlert()">Thread Gage Maintenance</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Pin Bin Maintenance" onclick="showPermissionAlert()">Pin Bin Maintenance</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Pin Type Maintenance" onclick="showPermissionAlert()">Pin Type Maintenance</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Site Maintenance" onclick="showPermissionAlert()">Site Maintenance</a></li>';
  }

  mainWindowHTML = mainWindowHTML + `<div class="last-run-info">${overdueTicketRunMessage}</div>`;

  $('.main-window').html(mainWindowHTML);

}


function generateOverdueEmails() {
  
  if (checkPermissions() == false) {
    showPermissionAlert();
    return;
  }
  executeIFrameUpdate();
  $('.last-run-info').text(generateOverdueTicketMessage(true));
}


function generateOverdueTicketMessage(useCurrentUser) {
  var dateString = '';
  var employee_name = '';
  var overdueTicketMessage = '';

  if (checkPermissions() == false) {
    return overdueTicketMessage;
  }

  if (useCurrentUser) {
    dateString = moment().format("MM/DD/YYYY hh:mm:ss A");
    employee_name = $('.user-name input').val();
  }
  else {
    dateString = $('.last-overdue-email-run-date input').val();
    employee_name = $('.last-overdue-email-run-employee-name input').val();

    if (typeof dateString === 'undefined') {
      return overdueTicketMessage;
    }
    if (typeof employee_name === 'undefined') {
      return overdueTicketMessage;
    }
  }

  overdueTicketMessage = `Overdue Ticket emails last generated ${dateString} by ${employee_name}`;
  
  return overdueTicketMessage;
}


function isUserAdmin() {
  var return_val = true;
  var is_admin_user = Number($(".user-isadmin input").val());

  if (typeof is_admin_user === 'undefined') {
    return false;
  }

  if ((is_admin_user == 0) || (is_admin_user == null)) {
    return_val = false;
  }
  return return_val;
}


function showPermissionAlert() {
  $.alert({
    title: 'Error',
    icon: 'fa fa-warning',
    type: 'orange',
    content: 'Sorry, you do not have permissions to see this form.',
  });

}