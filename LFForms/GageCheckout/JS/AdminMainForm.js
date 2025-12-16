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
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/GageTicketAdministration" title="Gage Administration" target="_self">Tickets</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/GageCalibration" title="Gage Calibration" target="_self">Calibration</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/GageRequestMaintenance" title="Gage Request Maintenance" target="_self">Gage Request Maintenance</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-CheckoutMainform" title="Gage Checkout" target="_self">Gage Checkout</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-TicketHistory" title="Ticket History" target="_self">Ticket History</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-BinHistory" title="Ticket History" target="_self">Bin History</a></li>'
    mainWindowHTML = mainWindowHTML + '<li></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Generate Overdue Ticket EMails" onclick="generateOverdueEmails()">Generate Overdue Ticket EMails</a></li>'
    mainWindowHTML = mainWindowHTML + '</ul></div><div class="column"><ul>'

    if (isAdmin) {
      mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/GageUserMaintenance" title="Users" target="_self">Users</a></li>'
    }
    else {
      mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Users" onclick="showPermissionAlert()">Users</a></li>';
    }
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-CellLeaders" title="Cell Leaders" target="_self">Cell Leaders</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-MachineGroups" title="Machine Groups" target="_self">Machine Groups</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-Departments" title="Departments" target="_self">Departments</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-Bins" title="Pin Bins" target="_self">Pin Bins</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-PinTypes" title="Pin Types" target="_self">Pin Types</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-ProductionMachines" title="Production Machines" target="_self">Production Machines</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="http://rmslf/Forms/RMS-GAGE-Sites" title="Sites" target="_self">Sites</a></li>'
    mainWindowHTML = mainWindowHTML + '</ul></div></div>'

  }
  else {
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Gage Administration" onclick="showPermissionAlert()">Tickets</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Gage Calibration" onclick="showPermissionAlert()">Calibration</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Gage Request Maintenance" onclick="showPermissionAlert()">Gage Request Maintenance</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Gage Checkout" onclick="showPermissionAlert()">Gage Checkout</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Ticket History" onclick="showPermissionAlert()>Ticket History</a></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Bin History" onclick="showPermissionAlert()>Bin History</a></li>'
    mainWindowHTML = mainWindowHTML + '<li></li>'
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Generate Overdue Ticket EMails" onclick="showPermissionAlert()">Generate Overdue Ticket EMails</a></li>';
    mainWindowHTML = mainWindowHTML + '</ul></div><div class="column"><ul>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Users" onclick="showPermissionAlert()">Users</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Cell Leaders" onclick="showPermissionAlert()">Cell Leaders</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Machine Groups" onclick="showPermissionAlert()">Machine Groups</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Departments" onclick="showPermissionAlert()">Departments</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Pin Bins" onclick="showPermissionAlert()">Pin Bins</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Pin Types" onclick="showPermissionAlert()">Pin Types</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Production Machines" onclick="showPermissionAlert()">Production Machines</a></li>';
    mainWindowHTML = mainWindowHTML + '<li><a href="javascript:void(0);" title="Sites" onclick="showPermissionAlert()">Sites</a></li>';
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