let should_print_receipt = false
$(document).ready(function () {
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $(document).prop('title', 'Gage Administration MainForm');
  $('.Submit').hide();
  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");

  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const printEvent = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {
    $("#print-iframe").get(0).contentWindow.print();
  });

  $(document).on("onloadlookupfinished", function () {
    console.log('Is Anonymous', isUserAnonymous());
    generateAppliationLinks();
  });


});


function buildLinkItem(link, isEnabled) {
  if (isEnabled) {
    return `<li><a href="${link.href}" title="${link.title}" target="_self">${link.label}</a></li>`;
  }

  return `<li><a href="javascript:void(0);" title="${link.title}" onclick="showPermissionAlert()">${link.label}</a></li>`;
}


function checkPermissions() {

  const employee_number = $(".user-id input").val();
  const is_active_user = Number($(".user-isactive input").val());
  let return_val = true;


  if (typeof is_active_user === 'undefined') {
    return false;
  }

  if (typeof employee_number === 'undefined') {
    return false;
  }


  if ((is_active_user === 0) || (is_active_user === null)) {
    return_val = false;
  }

  if ((employee_number === '') || (employee_number === null)) {
    return_val = false;
  }

  return return_val

}


function isUserAnonymous() {
  const networkUserName = $(".network-user-name input").val();
  return networkUserName === "Anonymous User";
}


function generateAppliationLinks() {
  const siteID = $('.site-id input').val();
  const hasPermissions = checkPermissions();
  const isAdmin = isUserAdmin();
  const isAnonymous = isUserAnonymous();
  const firstColumnLinks = [
    {
      label: 'Login',
      title: 'Login',
      href: 'http://rmslf/Forms/account/login?returnUrl=%2fForms%2fGAGE-AdminMainForm',
      anonymousOnly: true
    },
    {label: 'Tickets', title: 'Gage Administration', href: 'http://rmslf/Forms/GageTicketAdministration'},

    {
      label: 'Gage Request Maintenance',
      title: 'Gage Request Maintenance',
      href: 'http://rmslf/Forms/GageRequestMaintenance'
    },
    {label: 'Gage Checkout', title: 'Gage Checkout', href: 'http://rmslf/Forms/RMS-GAGE-CheckoutMainform'},
    {label: 'Ticket History', title: 'Ticket History', href: 'http://rmslf/Forms/RMS-GAGE-TicketHistory'},
    {label: 'Bin History', title: 'Ticket History', href: 'http://rmslf/Forms/RMS-GAGE-BinHistory'},
    {label: 'Thread Gages', title: 'Thread Gages', href: 'http://rmslf/Forms/RMS-GAGE-ThreadGages'},
    {label: 'Overdue Tickets', title: 'Overdue Tickets', href: `http://rmslf/Forms/RMS-GAGE-OverDueTicketsReport?site-id=${siteID}`},
    {label: 'Thread Member Inventory', title: 'Thread Member Inventory', href: 'http://rmslf/Forms/RMS-Gage-ThreadMemberInventory'},
  ];

  const secondColumnLinks = [
    {label: 'Users', title: 'Users', href: 'http://rmslf/Forms/GageUserMaintenance', adminOnly: true},
    {label: 'Cell Leaders', title: 'Cell Leaders', href: 'http://rmslf/Forms/RMS-GAGE-CellLeaders'},
    {label: 'Machine Groups', title: 'Machine Groups', href: 'http://rmslf/Forms/RMS-GAGE-MachineGroups'},
    {label: 'Departments', title: 'Departments', href: 'http://rmslf/Forms/RMS-GAGE-Departments'},
    {label: 'Pin Bins', title: 'Pin Bins', href: 'http://rmslf/Forms/RMS-GAGE-Bins'},
    {label: 'Pin Types', title: 'Pin Types', href: 'http://rmslf/Forms/RMS-GAGE-PinTypes'},
    {
      label: 'Production Machines',
      title: 'Production Machines',
      href: 'http://rmslf/Forms/RMS-GAGE-ProductionMachines'
    },
    {label: 'Sites', title: 'Sites', href: 'http://rmslf/Forms/RMS-GAGE-Sites'},
  ];


  const firstColumnHtml = firstColumnLinks
    .filter(function (link) {
      return !link.anonymousOnly || isAnonymous;
    })
    .map(function (link) {
      const canAccessLink = link.anonymousOnly ? true : hasPermissions;
      return buildLinkItem(link, canAccessLink);
    })
    .join('');

  const secondColumnHtml = secondColumnLinks
    .map(function (link) {
      const canAccessLink = hasPermissions && (!link.adminOnly || isAdmin);
      return buildLinkItem(link, canAccessLink);
    })
    .join('');


  let userName = $('.user-name input').val();
  if (userName === 'Anonymous User' || userName === '') {
    userName = 'Anonymous User';
  }

  const userNameHTML = `<span class="user-name-display">User: ${userName}</span>`;
  $('#form-title-wrap').append(userNameHTML);

  const mainWindowHTML = `<div class="row"><div class="column"><ul>${firstColumnHtml}</ul></div><div class="column"><ul>${secondColumnHtml}</ul></div></div>`;


  $('.main-window').html(mainWindowHTML);

}


function isUserAdmin() {
  let return_val = true;
  const is_admin_user = Number($(".user-isadmin input").val());

  if (typeof is_admin_user === 'undefined') {
    return false;
  }

  if ((is_admin_user === 0) || (is_admin_user === null)) {
    return_val = false;
  }
  return return_val;
}


function print_report() {

  const siteID = $('.site-id input').val();
  if (siteID.length === 0) {
    return;
  }

  const domain = document.location.hostname;
  const report_url_root = document.location.protocol + "//" + domain + "/Forms/";
  let receipt_url = '';
  receipt_url = report_url_root + "PinGageReceipt?guid=" + ticketGuid;



  if (should_print_receipt === true) {
    if (receipt_url !== "") {
      loadiFrame(receipt_url);
      should_print_receipt = false;
      $('.print-ticket-id input').val(null).trigger("change");
    }
  }
}


function showPermissionAlert() {
  $.alert({
    title: 'Error',
    icon: 'fa fa-warning',
    type: 'orange',
    content: 'Sorry, you do not have permissions to see this form.',
  });

}
