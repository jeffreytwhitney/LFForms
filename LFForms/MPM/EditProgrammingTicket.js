var mfgEngineerMap = new Map();
var mfgEngineerNameMap = new Map();
var qualEngineerMap = new Map();
var qualEngineerNameMap = new Map();
var cellLeaderMap = new Map();
var cellLeaderNameMap = new Map();

$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').addClass('ui-button ui-corner-all ui-widget');
  $('.Submit').click(function (e) { submitForm(e); });

  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != "") {
    let networkUserName = lfUserName.toUpperCase();
    networkUserName = networkUserName.substr(networkUserName.lastIndexOf('\\') + 1);
    $('.network-user-name input').val(networkUserName).change();
  }

  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  window.onmessage = function (event) {

    if (event.data == "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshForm();
    }
  };

  $(document).on('lookupcomplete', function (e) {
    loadMfgEngineerMap();
    loadQualEngineerMap();
    loadCellLeaderMap();

    if (($('.mename input').val() != null) && ($('.manufacturing-engineer-combo select option').length > 0)) {
      $('.manufacturing-engineer-combo select').val($('.mename input').val());
    }
    if (($('.qename input').val() != null) && ($('.quality-engineer-combo select option').length > 0)) {
      $('.quality-engineer-combo select').val($('.qename input').val());
    }
    if (($('.cell-leader-name input').val() != null) && ($('.cell-leader-combo option').length > 0)) {
      $('.cell-leader-combo select').val($('.cell-leader-name input').val());
    }
  });

  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");

    $('.manufacturing-engineer-combo select').change(function () {
      let meName =$('.manufacturing-engineer-combo select').val();
      let meID = mfgEngineerNameMap.get(meName);
      $('.meid input').val(meID);
    });

    $('.quality-engineer-combo select').change(function () {
      let qeName = $('.quality-engineer-combo select').val();
      let qeID = qualEngineerNameMap.get(qeName);
      $('.qeid input').val(qeID);
    });

    $('.cell-leader-combo select').change(function () {
      let cellLeaderName = $('.cell-leader-combo select').val();
      let cellLeaderID = cellLeaderNameMap.get(cellLeaderName);
      $('.cell-leader-id input').val(cellLeaderID);
    });

  });
});


function checkPermissions() {

  var user_id = $(".user-id input").val();
  var is_active_user = $(".user-isactive input").val();
  var user_type_id = $(".user-type-id input").val();
  var user_department_id = $(".user-department-id input").val();
  var ticket_department_id = $(".ticket-department-id input").val();
  var init_usertype_id = $(".ticket-initiator-user-type-id input").val();
  var return_val = true;

  if (is_active_user == 0) {
    return_val = false;
  }

  if (user_id == 0) {
    return_val = false;
  }

  if (user_type_id != 1) {
    if (user_department_id != init_department_id) {
      return_val = false;
    }
    if (user_type_id != init_usertype_id) {
      return_val = false;
    }
  }

  return return_val

}


function loadCellLeaderMap() {
  if (cellLeaderMap.keys.length == 0) {
    var cellLead_rows = $('.cellleader-lookup-table table tbody tr');
    if (cellLead_rows.length == 0) {
      return;
    }
    cellLead_rows.each(function (index) {
      meID = Number($(this).find('.cellleader-lookup-table-id input').val());
      meName = $(this).find('.cellleader-lookup-table-name input').val();
      cellLeaderMap.set(meID, meName);
      cellLeaderNameMap.set(meName, meID);
    });
  }
}


function loadMfgEngineerMap() {
  if (mfgEngineerMap.keys.length == 0) {
    var me_rows = $('.me-lookup-table table tbody tr');
    if (me_rows.length == 0) {
      return;
    }
    me_rows.each(function (index) {
      meID = Number($(this).find('.me-lookup-table-id input').val());
      meName = $(this).find('.me-lookup-table-name input').val();
      mfgEngineerMap.set(meID, meName);
      mfgEngineerNameMap.set(meName, meID);
    });
  }
}


function loadQualEngineerMap() {
  if (qualEngineerMap.keys.length == 0) {
    var qe_rows = $('.qe-lookup-table table tbody tr');
    if (qe_rows.length == 0) {
      return;
    }
    qe_rows.each(function (index) {
      qeID = Number($(this).find('.qe-lookup-table-id input').val());
      qeName = $(this).find('.qe-lookup-table-name input').val();
      qualEngineerMap.set(qeID, qeName);
      qualEngineerNameMap.set(qeName, qeID);
    });
  }
}